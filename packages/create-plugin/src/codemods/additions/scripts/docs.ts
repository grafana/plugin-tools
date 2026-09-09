import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { glob } from 'glob';
import * as v from 'valibot';
import type { Context } from '../../context.js';
import { TEMPLATES_DIR } from '../../../constants.js';
import { output } from '../../../utils/utils.console.js';
import { isFile } from '../../../utils/utils.files.js';
import { getPackageManagerInstallCmd } from '../../../utils/utils.packageManager.js';
import { additionsDebug, addDependenciesToPackageJson, isVersionGreater, readJsonFile } from '../../utils.js';

export const schema = v.object({
  docsPath: v.optional(
    v.pipe(
      v.string(),
      v.minLength(1, 'docsPath must not be empty.'),
      v.check(
        (value) => !value.startsWith('/') && !value.split('/').includes('..'),
        'docsPath must be a relative path without ".." segments.'
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
  // through: every copy step below skips files that exist, making a re-run additive.
  if (existingDocsPath === undefined && existsSync(join(context.basePath, docsPath))) {
    throw new Error(
      `A directory already exists at '${docsPath}' but src/plugin.json has no docsPath.\n  Point the plugin at it by setting "docsPath": "${docsPath}" in src/plugin.json, or scaffold elsewhere:\n  create-plugin add docs --docsPath <alternative-path>`
    );
  }

  // step 2: set docsPath in src/plugin.json
  context.updateFile('src/plugin.json', JSON.stringify({ ...pluginJson, docsPath }, null, 2));

  if (!pluginJson.name) {
    throw new Error('src/plugin.json has no "name". Add one - it is used as the title throughout the docs.');
  }
  const pluginName = pluginJson.name;
  const pluginId = pluginJson.id ?? pluginName;
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
  addDependenciesToPackageJson(context, {}, { '@grafana/plugin-docs-cli': '^0.2.1' });

  // step 4: add docs:serve and docs:validate npm scripts
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

  // step 8: scaffold the docs authoring guide and bootstrap skill. `agentAssistanceAdded` is false
  // on a re-run where every agent file already exists, which changes the next-steps wording.
  const agentAssistanceAdded = copyAgentTemplates(context, templateDir, substitutions);
  const instructionsPointerAdded = agentAssistanceAdded && appendDocsPointerToInstructions(context, docsPath);

  // step 9: print next-steps summary
  printNextSteps({
    docsPath,
    packageManagerName,
    agentAssistanceAdded,
    instructionsPointerAdded,
    readmePresent: existsSync(join(context.basePath, 'README.md')),
  });

  return context;
}

function printNextSteps(opts: {
  docsPath: string;
  packageManagerName: string;
  agentAssistanceAdded: boolean;
  instructionsPointerAdded: boolean;
  readmePresent: boolean;
}): void {
  const { docsPath, packageManagerName, agentAssistanceAdded, instructionsPointerAdded, readmePresent } = opts;

  // Lead with what everyone has to do, by hand or otherwise. The skill is an accelerant, not the
  // route - a reader with no coding agent must still find a first step they can act on.
  const body: string[] = [
    `Fill in the stub pages under ${docsPath}/ - each section carries a note saying what belongs there`,
    `Read ${docsPath}/README.md for the four catalog tabs and what belongs on each`,
    `Until every stub is filled, \`${packageManagerName} run docs:validate\` reports each one as an error - that count is your to-do list`,
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
  output.log({ title: 'Next steps', body });
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
  return Object.entries(substitutions).reduce((acc, [token, value]) => acc.replaceAll(token, value), content);
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
// npm, which matches what `create-plugin` assumes elsewhere.
function readPackageManager(context: Context): { name: string; version: string } {
  const packageJson = readJsonFile<{ packageManager?: string }>(context, 'package.json');
  const match = /^([a-z]+)@(\d+\.\d+\.\d+)/.exec(packageJson.packageManager ?? '');
  if (!match) {
    additionsDebug('no usable packageManager field in package.json, assuming npm');
    return { name: 'npm', version: '0.0.0' };
  }
  return { name: match[1], version: match[2] };
}

function readTemplate(templateDir: string, relativePath: string): string {
  return readFileSync(join(templateDir, relativePath), 'utf-8');
}

// matches an anchored `uses: grafana/plugin-actions/build-plugin@<ref>` line,
// capturing the prefix (for reassembly) and the existing ref (to compare
// versions before overwriting it).
const BUILD_PLUGIN_USES_RE = /(uses:\s*grafana\/plugin-actions\/build-plugin@)([^\s'"]+)/g;
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
    // only skip the bump when both refs parse as versions and the existing one
    // is already at least as new - an unparseable ref (a branch, a SHA) always
    // gets normalized to the required tag.
    if (existingVersion && requiredVersion && !isVersionGreater(requiredVersion, existingVersion, false)) {
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
    scripts['docs:validate'] = 'plugin-docs-cli validate --strict';
    changed = true;
  } else {
    additionsDebug('docs:validate already exists in package.json scripts, skipping');
  }

  if (changed) {
    context.updateFile('package.json', JSON.stringify({ ...packageJson, scripts }, null, 2));
  }
}
