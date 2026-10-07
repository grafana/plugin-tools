import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { glob } from 'glob';
import * as v from 'valibot';
import type { Context, ContextMessage } from '../../context.js';
import { TEMPLATES_DIR } from '../../../constants.js';
import { isFile } from '../../../utils/utils.files.js';
import { getPackageManagerInstallCmd } from '../../../utils/utils.packageManager.js';
import { additionsDebug, addDependenciesToPackageJson, isVersionGreater, readJsonFile } from '../../utils.js';

// A conservative allowlist rather than a denylist, because this value both becomes a path on disk
// and is embedded, unescaped, into a YAML workflow and a GitHub Actions path filter - a leading
// `./`, a trailing slash, a backslash or a quote character each break one of those in a way that
// is easy to miss until CI or `generate` acts on it.
const DOCS_PATH_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]|\/[a-zA-Z0-9_-])*$/;

export const schema = v.object({
  docsPath: v.optional(
    v.pipe(
      v.string(),
      v.minLength(1, 'docsPath must not be empty.'),
      v.regex(
        DOCS_PATH_RE,
        'docsPath must be a relative path of letters, digits, hyphens, underscores and single "/" separators (for example "docs" or "docs/plugin"), with no leading "/", "./", trailing "/", ".." segment, backslash or quote character.'
      )
    ),
    'docs'
  ),
});

type Options = v.InferOutput<typeof schema>;

// Plugin types with a template set under `templates/docs/<type>/`. Adding a type here without
// adding its templates fails loudly at scaffold time, which is the intent - the two go together.
const SUPPORTED_PLUGIN_TYPES = ['panel'] as const;
type SupportedPluginType = (typeof SUPPORTED_PLUGIN_TYPES)[number];

export default function docs(context: Context, options: Options): Context {
  const pluginType = assertSupportedPluginType(context);
  return setupDocsScaffolding({
    context,
    docsPath: options.docsPath,
    // docs templates are split by plugin type, sharing `docs/common/`. `templates/docs` is
    // deliberately absent from TEMPLATE_PATHS, so `generate` ignores it until we scaffold docs for
    // every new plugin.
    templateDir: join(TEMPLATES_DIR, 'docs', pluginType),
    commonTemplateDir: join(TEMPLATES_DIR, 'docs', 'common'),
  });
}

const REQUIRED_BUILD_PLUGIN_REF = 'build-plugin/v1.2.0';

interface PluginJson {
  type?: string;
  name?: string;
  id?: string;
  docsPath?: string;
  [key: string]: unknown;
}

export interface DocsSetupOptions {
  context: Context;
  docsPath: string;
  /** Templates specific to this plugin type, under `templates/docs/<type>/`. */
  templateDir: string;
  /** Templates shared by every plugin type, under `templates/docs/common/`. */
  commonTemplateDir: string;
}

export function setupDocsScaffolding(opts: DocsSetupOptions): Context {
  const { context, docsPath, templateDir, commonTemplateDir } = opts;

  // step 1: reconcile the requested docsPath with what the plugin already has
  const pluginJson = readPluginJson(context);
  const existingDocsPath = pluginJson.docsPath;

  if (existingDocsPath !== undefined && existingDocsPath !== docsPath) {
    throw new Error(
      `src/plugin.json already has docsPath set to '${existingDocsPath}'.\n  Re-run with the existing path:\n  create-plugin add docs --docsPath ${existingDocsPath}`
    );
  }

  // A folder that plugin.json does not know about is someone else's - refuse rather than scatter
  // pages into it. A folder this plugin already declares is our own from a previous run, so fall
  // through: every copy step below skips files that exist, making a re-run additive. Checked
  // through the context, not raw fs.existsSync, so a docsPath staged earlier in the same run
  // counts too; doesFileExistOnDisk also catches an empty directory, which readDir alone would
  // read as "nothing here" and wrongly let through.
  if (
    existingDocsPath === undefined &&
    (context.doesFileExistOnDisk(docsPath) || context.readDir(docsPath).length > 0)
  ) {
    throw new Error(
      `A directory already exists at '${docsPath}' but src/plugin.json has no docsPath.\n  Point the plugin at it by setting "docsPath": "${docsPath}" in src/plugin.json, or scaffold elsewhere:\n  create-plugin add docs --docsPath <alternative-path>`
    );
  }

  if (!pluginJson.name) {
    throw new Error('src/plugin.json has no "name". Add one - it is used as the title throughout the docs.');
  }
  const pluginName = pluginJson.name;
  if (!pluginJson.id) {
    additionsDebug('src/plugin.json has no "id", falling back to "name" - catalog links will be wrong until it is set');
  }
  const pluginId = pluginJson.id ?? pluginName;

  // step 2: set docsPath in src/plugin.json, only when it is not already set to this value -
  // reserializing unconditionally would reformat the author's file on every re-run.
  if (existingDocsPath !== docsPath) {
    context.updateFile('src/plugin.json', JSON.stringify({ ...pluginJson, docsPath }, null, 2));
  }

  const { name: packageManagerName, version: packageManagerVersion } = readPackageManager(context);

  // every template - docs stubs, agent guidance and the workflow - is filled from this one map, so
  // a placeholder added to any template works everywhere without extra plumbing.
  const substitutions: Record<string, string> = {
    '{{pluginName}}': pluginName,
    '{{pluginId}}': pluginId,
    '{{docsPath}}': docsPath,
    '{{packageManagerName}}': packageManagerName,
    '{{packageManagerInstallCmd}}': getPackageManagerInstallCmd(packageManagerName, packageManagerVersion),
    // pnpm needs its own setup action; corepack reads the version from package.json's
    // `packageManager` field, which is why the action takes no `with:` block.
    '{{pnpmSetup}}':
      packageManagerName === 'pnpm'
        ? '\n      # pnpm action uses the packageManager field in package.json to\n      # understand which version to install.\n      - uses: pnpm/action-setup@v6'
        : '',
  };

  // step 3: add @grafana/plugin-docs-cli as a devDependency
  addDependenciesToPackageJson(context, {}, { '@grafana/plugin-docs-cli': '0.5.0' });

  // step 4: add docs:serve, docs:validate and docs:validate:release npm scripts
  addDocsScripts(context);

  // step 5: copy template files to docs folder (includes README.md)
  copyDocsTemplates(context, templateDir, docsPath, substitutions);

  // step 6: copy validate-docs workflow, unless the user already customized one
  const workflowPath = '.github/workflows/validate-docs.yml';
  if (!context.doesFileExist(workflowPath)) {
    const workflowContent = interpolate(readTemplate(commonTemplateDir, 'workflows/validate-docs.yml'), substitutions);
    context.addFile(workflowPath, workflowContent);
  } else {
    additionsDebug(`${workflowPath} already exists, skipping`);
  }

  // step 7: bump build-plugin version in release.yml
  bumpBuildPluginVersion(context);

  // step 8: scaffold the docs authoring guide and bootstrap skill. The pointer is appended
  // whenever instructions.md exists, not only when this run wrote new agent files, so a re-run
  // restores it if it went missing - appendDocsPointerToInstructions is already idempotent via
  // DOCS_INSTRUCTIONS_MARKER.
  copyAgentTemplates(context, templateDir, substitutions);
  const instructionsPointerAdded = appendDocsPointerToInstructions(context, docsPath);

  // step 9: queue the next-steps summary. Deferred via setMessage rather than printed here, so it
  // appears after the runner's own change list and install output instead of above them, and only
  // when this run actually changed something - a clean re-run stays quiet.
  if (context.hasChanges()) {
    context.setMessage(
      buildNextStepsMessage({
        docsPath,
        packageManagerName,
        agentAssistanceAdded: anyAgentFileExists(context),
        instructionsPointerAdded,
        readmePresent: context.doesFileExist('README.md'),
      })
    );
  }

  return context;
}

function buildNextStepsMessage(opts: {
  docsPath: string;
  packageManagerName: string;
  agentAssistanceAdded: boolean;
  instructionsPointerAdded: boolean;
  readmePresent: boolean;
}): ContextMessage {
  const { docsPath, packageManagerName, agentAssistanceAdded, instructionsPointerAdded, readmePresent } = opts;

  // Lead with what everyone has to do, by hand or otherwise. The skill is an accelerant, not the
  // route - a reader with no coding agent must still find a first step they can act on.
  const body: string[] = [
    `Fill in the stub pages under ${docsPath}/ - each section carries a note saying what belongs there`,
    `Read ${docsPath}/README.md for the four catalog tabs and what belongs on each`,
    `\`${packageManagerName} run docs:validate\` counts the stubs left to fill`,
    `Before you release, run \`${packageManagerName} run docs:validate:release\` - it fails on any stub left unfilled, like the release check does`,
  ];

  if (agentAssistanceAdded) {
    const readmeMention = readmePresent ? ', mining your README for content' : '';
    body.push(`Using a coding agent? \`/bootstrap-plugin-docs\` drafts the pages from your source${readmeMention}`);
    if (!instructionsPointerAdded) {
      body.push(
        'No .config/AGENTS/instructions.md found, so nothing points at .config/AGENTS/plugin-docs.md - reference it from your own agent instructions'
      );
    }
  }

  body.push(
    `Preview with \`${packageManagerName} run docs:serve\`, check with \`${packageManagerName} run docs:validate\``
  );
  return { level: 'log', title: 'Next steps', body };
}

// `readJsonFile` covers the missing-file and unparseable cases. it does not check the shape, so
// guard against the JSON values that parse fine but are not a usable plugin.json (`null`, an array,
// a bare string).
function readPluginJson(context: Context): PluginJson {
  const parsed = readJsonFile<PluginJson>(context, 'src/plugin.json');
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('src/plugin.json does not contain a JSON object.');
  }
  return parsed;
}

// Reads the plugin type from plugin.json and refuses the ones we have no templates for yet. The
// docs themselves differ per type - a panel documents its options and data formats, a data source
// documents queries and configuration - so there is nothing sensible to scaffold without them.
export function assertSupportedPluginType(context: Context): SupportedPluginType {
  const { type } = readPluginJson(context);

  if (isSupportedPluginType(type)) {
    return type;
  }

  const supported = SUPPORTED_PLUGIN_TYPES.join(', ');
  if (type === 'app' || type === 'datasource') {
    throw new Error(`create-plugin add docs does not support '${type}' plugins yet. Supported so far: ${supported}.`);
  }
  throw new Error(
    `create-plugin add docs needs a plugin type of ${supported} in src/plugin.json, but found '${type ?? 'unset'}'.`
  );
}

function isSupportedPluginType(type: string | undefined): type is SupportedPluginType {
  return SUPPORTED_PLUGIN_TYPES.includes(type as SupportedPluginType);
}

function interpolate(content: string, substitutions: Record<string, string>): string {
  // the replacement is a function, not a string, so a value containing "$&" or similar is
  // inserted literally instead of being read as a replacement pattern.
  return Object.entries(substitutions).reduce((acc, [token, value]) => acc.replaceAll(token, () => value), content);
}

function copyDocsTemplates(
  context: Context,
  templateDir: string,
  docsPath: string,
  substitutions: Record<string, string>
): void {
  const docsTemplateDir = join(templateDir, 'docs');
  if (!existsSync(docsTemplateDir)) {
    throw new Error(
      `Cannot find docs templates at ${docsTemplateDir}. This is a bug in @grafana/create-plugin - please report it.`
    );
  }
  for (const filePath of glob.sync(`${docsTemplateDir}/**`, { dot: true }).filter(isFile)) {
    const relativePath = filePath.slice(docsTemplateDir.length + 1);
    const targetPath = `${docsPath}/${relativePath}`;
    if (!context.doesFileExist(targetPath)) {
      context.addFile(targetPath, interpolate(readFileSync(filePath, 'utf-8'), substitutions));
    } else {
      additionsDebug(`${targetPath} already exists, skipping`);
    }
  }
}

// Skills have to be written once per agent, because no agent reads another's directory and
// SKILL.md supports no include mechanism - Claude Code ignores the `@import` syntax that works in
// CLAUDE.md, and a SKILL.md whose first line isn't `---` is treated as literal content rather than
// parsed for frontmatter. So each destination gets a complete, self-contained copy.
//
// `.agents/skills/` is the emerging cross-agent path (Cursor, Copilot, Gemini CLI and Amp read it).
// `.codex/skills/` is kept as well because that is where `templates/common` already puts the
// build-plugin and validate-plugin skills - a Codex user who only reads `.codex/` would otherwise
// see those two and not this one.
const DOCS_INSTRUCTIONS_MARKER = 'before writing or modifying plugin documentation';
const SKILLS_TEMPLATE_PREFIX = 'skills/';
const SKILL_TARGET_DIRS = ['.claude/skills', '.agents/skills', '.codex/skills'];
const BOOTSTRAP_SKILL_NAME = 'bootstrap-plugin-docs';

// True once the bootstrap skill has landed in at least one agent's skills directory, whether this
// run wrote it or an earlier one did - used to decide whether next-steps mentions the skill.
function anyAgentFileExists(context: Context): boolean {
  return SKILL_TARGET_DIRS.some((dir) => context.doesFileExist(`${dir}/${BOOTSTRAP_SKILL_NAME}/SKILL.md`));
}

// The `agent/` template subtree mirrors its destination, except `skills/` which fans out to every
// agent's skills directory:
//   agent/.config/AGENTS/plugin-docs.md  -> .config/AGENTS/plugin-docs.md
//   agent/skills/<name>/SKILL.md         -> .claude/skills/<name>/SKILL.md
//                                        -> .agents/skills/<name>/SKILL.md
function copyAgentTemplates(context: Context, templateDir: string, substitutions: Record<string, string>): boolean {
  const agentTemplateDir = join(templateDir, 'agent');
  if (!existsSync(agentTemplateDir)) {
    throw new Error(
      `Cannot find agent templates at ${agentTemplateDir}. This is a bug in @grafana/create-plugin - please report it.`
    );
  }
  let wroteSomething = false;
  for (const filePath of glob.sync(`${agentTemplateDir}/**`, { dot: true }).filter(isFile)) {
    const relPath = filePath.slice(agentTemplateDir.length + 1);
    const content = interpolate(readFileSync(filePath, 'utf-8'), substitutions);
    const targetPaths = relPath.startsWith(SKILLS_TEMPLATE_PREFIX)
      ? SKILL_TARGET_DIRS.map((dir) => `${dir}/${relPath.slice(SKILLS_TEMPLATE_PREFIX.length)}`)
      : [relPath];

    for (const targetPath of targetPaths) {
      if (context.doesFileExist(targetPath)) {
        additionsDebug(`${targetPath} already exists, skipping`);
        continue;
      }
      context.addFile(targetPath, content);
      wroteSomething = true;
    }
  }
  return wroteSomething;
}

// points the plugin's existing agent instructions at the docs authoring guide. No-op when the
// plugin predates the `.config/AGENTS/` convention.
function appendDocsPointerToInstructions(context: Context, docsPath: string): boolean {
  const targetPath = '.config/AGENTS/instructions.md';
  const existing = context.getFile(targetPath);
  if (existing === undefined) {
    additionsDebug(`${targetPath} not found; skipping docs guide pointer`);
    return false;
  }
  if (existing.includes(DOCS_INSTRUCTIONS_MARKER)) {
    additionsDebug(`${targetPath} already points at the docs guide, skipping`);
    return true;
  }
  const trailingNewline = existing.endsWith('\n') ? '' : '\n';
  const line = `- This plugin ships multi-page docs under \`${docsPath}/\`. Keep them in sync when features change in \`src/\`. Read @./.config/AGENTS/plugin-docs.md ${DOCS_INSTRUCTIONS_MARKER}.\n`;
  context.updateFile(targetPath, `${existing}${trailingNewline}${line}`);
  return true;
}

// The corepack `packageManager` field is what every scaffolded plugin records and what CI actions
// read, so it is the authoritative answer for an existing plugin. Plugins predating it fall back to
// whichever lockfile is present, matching the `getPackageManagerWithFallback` behaviour the runner
// and other codemods rely on - otherwise a yarn/pnpm plugin without the field would get an npm-only
// docs:validate workflow while the rest of the toolchain installs with yarn/pnpm.
function readPackageManager(context: Context): { name: string; version: string } {
  const packageJson = readJsonFile<{ packageManager?: string }>(context, 'package.json');
  const match = /^([a-z]+)@(\d+\.\d+\.\d+)/.exec(packageJson.packageManager ?? '');
  if (match) {
    return { name: match[1], version: match[2] };
  }

  additionsDebug('no usable packageManager field in package.json, checking for a lockfile');
  if (context.doesFileExist('yarn.lock')) {
    return { name: 'yarn', version: '4.0.0' };
  }
  if (context.doesFileExist('pnpm-lock.yaml')) {
    return { name: 'pnpm', version: '9.0.0' };
  }
  return { name: 'npm', version: '10.9.0' };
}

function readTemplate(templateDir: string, relativePath: string): string {
  return readFileSync(join(templateDir, relativePath), 'utf-8');
}

// matches an anchored `uses: grafana/plugin-actions/build-plugin@<ref>` line, optionally quoted,
// capturing the prefix (for reassembly) and the existing ref (to compare versions before
// overwriting it).
const BUILD_PLUGIN_USES_RE = /(uses:\s*['"]?grafana\/plugin-actions\/build-plugin@)([^\s'"]+)/g;
// matches the version out of either a bare `vX.Y.Z` tag or a `build-plugin/vX.Y.Z`
// tag - the two ref shapes this codemod and its templates actually use.
const BUILD_PLUGIN_TAG_RE = /^(?:build-plugin\/)?v(\d+\.\d+\.\d+)$/;

function bumpBuildPluginVersion(context: Context): void {
  const releaseYmlContent = context.getFile('.github/workflows/release.yml');
  if (!releaseYmlContent) {
    additionsDebug('no .github/workflows/release.yml found, skipping build-plugin version bump');
    return;
  }

  let matched = false;
  const requiredVersion = BUILD_PLUGIN_TAG_RE.exec(REQUIRED_BUILD_PLUGIN_REF)?.[1];
  const updated = releaseYmlContent.replace(BUILD_PLUGIN_USES_RE, (fullMatch, prefix: string, existingRef: string) => {
    matched = true;
    const existingVersion = BUILD_PLUGIN_TAG_RE.exec(existingRef)?.[1];
    // an existing ref that doesn't parse as one of our two version-tag shapes is a branch or a
    // SHA pin, deliberately chosen by the author for reasons this codemod can't evaluate (a SHA
    // pin is often a hardening measure) - leave it alone rather than normalizing it to a mutable
    // tag. Only bump when the existing ref is a version tag and it is older than required.
    if (!existingVersion) {
      additionsDebug(`release.yml pins build-plugin@${existingRef}, which is not a version tag, leaving it as-is`);
      return fullMatch;
    }
    if (requiredVersion && !isVersionGreater(requiredVersion, existingVersion, false)) {
      additionsDebug(
        `release.yml already pins build-plugin@${existingRef}, which is not older than ${REQUIRED_BUILD_PLUGIN_REF}, skipping`
      );
      return fullMatch;
    }
    return `${prefix}${REQUIRED_BUILD_PLUGIN_REF}`;
  });

  if (!matched) {
    additionsDebug('no grafana/plugin-actions/build-plugin reference found in release.yml, skipping');
    return;
  }
  if (updated === releaseYmlContent) {
    additionsDebug('release.yml build-plugin reference(s) already up to date, skipping');
    return;
  }
  context.updateFile('.github/workflows/release.yml', updated);
}

function addDocsScripts(context: Context): void {
  const packageJson = readJsonFile<Record<string, unknown>>(context, 'package.json');
  const scripts = (packageJson['scripts'] ?? {}) as Record<string, string>;
  let changed = false;

  if (!scripts['docs:serve']) {
    scripts['docs:serve'] = 'plugin-docs-cli serve --port 3001 --reload';
    changed = true;
  } else {
    additionsDebug('docs:serve already exists in package.json scripts, skipping');
  }

  if (!scripts['docs:validate']) {
    // `--allow-unfilled-stubs` keeps scaffolded section-brief notes out of the error count while the
    // author is still writing, so a fresh scaffold validates clean. plugin-validator never passes it,
    // so half-written docs are still blocked at publish.
    scripts['docs:validate'] = 'plugin-docs-cli validate --strict --allow-unfilled-stubs';
    changed = true;
  } else {
    additionsDebug('docs:validate already exists in package.json scripts, skipping');
  }

  if (!scripts['docs:validate:release']) {
    scripts['docs:validate:release'] = 'plugin-docs-cli validate --strict';
    changed = true;
  } else {
    additionsDebug('docs:validate:release already exists in package.json scripts, skipping');
  }

  if (changed) {
    context.updateFile('package.json', JSON.stringify({ ...packageJson, scripts }, null, 2));
  }
}
