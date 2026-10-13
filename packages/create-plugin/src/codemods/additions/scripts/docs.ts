import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { glob } from 'glob';
import * as v from 'valibot';
import type { Context, ContextMessage } from '../../context.js';
import { TEMPLATE_PATHS, TEMPLATES_DIR } from '../../../constants.js';
import { isFile } from '../../../utils/utils.files.js';
import { renderHandlebarsTemplate } from '../../../utils/utils.handlebars.js';
import { getPackageManagerInstallCmd } from '../../../utils/utils.packageManager.js';
import { additionsDebug, addDependenciesToPackageJson, readJsonFile } from '../../utils.js';
import { type BumpActionRefsResult, bumpActionRefs } from '../../utils.workflows.js';

// an allowlist, because the value becomes a path on disk and is embedded unescaped in a YAML workflow
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

// each type needs a template set under `templates/docs/<type>/`
const SUPPORTED_PLUGIN_TYPES = ['panel'] as const;
type SupportedPluginType = (typeof SUPPORTED_PLUGIN_TYPES)[number];

export default function docs(context: Context, options: Options): Context {
  const pluginType = assertSupportedPluginType(context);
  return setupDocsScaffolding({
    context,
    docsPath: options.docsPath,
    // `templates/docs` is left out of TEMPLATE_PATHS so `generate` ignores it
    templateDir: join(TEMPLATES_DIR, 'docs', pluginType),
    commonTemplateDir: join(TEMPLATES_DIR, 'docs', 'common'),
  });
}

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

  // a folder plugin.json doesn't declare isn't ours. doesFileExistOnDisk also catches an empty directory
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

  // step 2: set docsPath, only rewriting plugin.json when it changes so re-runs don't reformat it
  if (existingDocsPath !== docsPath) {
    context.updateFile('src/plugin.json', JSON.stringify({ ...pluginJson, docsPath }, null, 2));
  }

  const { name: packageManagerName, version: packageManagerVersion } = readPackageManager(context);

  const substitutions: Record<string, string> = {
    '{{pluginName}}': pluginName,
    '{{pluginId}}': pluginId,
    '{{docsPath}}': docsPath,
    '{{packageManagerName}}': packageManagerName,
    '{{packageManagerInstallCmd}}': getPackageManagerInstallCmd(packageManagerName, packageManagerVersion),
    // corepack reads the pnpm version from `packageManager`, so the action needs no `with:` block
    '{{pnpmSetup}}':
      packageManagerName === 'pnpm'
        ? '\n      # pnpm action uses the packageManager field in package.json to\n      # understand which version to install.\n      - uses: pnpm/action-setup@v6'
        : '',
  };

  // step 3: add @grafana/plugin-docs-cli as a devDependency
  addDependenciesToPackageJson(context, {}, { '@grafana/plugin-docs-cli': '0.7.0' });

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

  // step 7: bump build-plugin and package-plugin in release.yml to versions that build docs
  const pluginActions = bumpActionRefs(context, RELEASE_WORKFLOW_PATH, REQUIRED_ACTION_REFS);

  // step 8: agent instructions, creating the root and .config/AGENTS files a plugin predating them lacks
  copyAgentTemplates(context, templateDir, substitutions);
  const unlinkedAgentFiles = ensureRootAgentFiles(context);
  ensureConfigAgentFiles(context, { pluginType: pluginJson.type, packageManagerName });
  appendDocsPointerToInstructions(context, docsPath);

  // step 9: deferred so it prints after the runner's change list, and only when something changed
  if (context.hasChanges()) {
    context.setMessage(
      buildNextStepsMessage({
        docsPath,
        packageManagerName,
        agentAssistanceAdded: anyAgentFileExists(context),
        readmePresent: context.doesFileExist('README.md'),
        pluginActions,
        unlinkedAgentFiles,
      })
    );
  }

  return context;
}

function buildNextStepsMessage(opts: {
  docsPath: string;
  packageManagerName: string;
  agentAssistanceAdded: boolean;
  readmePresent: boolean;
  pluginActions: BumpActionRefsResult;
  unlinkedAgentFiles: string[];
}): ContextMessage {
  const { docsPath, packageManagerName, agentAssistanceAdded, readmePresent, pluginActions, unlinkedAgentFiles } = opts;

  const body: string[] = [
    `Fill in the stub pages under ${docsPath}/ - each section carries a note saying what belongs there`,
    `Read ${docsPath}/README.md for the commands and a link to the plugin docs guide`,
    `\`${packageManagerName} run docs:validate\` counts the stubs left to fill`,
    `Before you release, run \`${packageManagerName} run docs:validate:release\` - it fails on any stub left unfilled, like the release check does`,
  ];

  if (pluginActions.found.length === 0) {
    body.push(
      `No grafana/plugin-actions build-plugin or package-plugin step found in ${RELEASE_WORKFLOW_PATH} - make sure your release pipeline builds ${docsPath}/ into the plugin archive, or the docs won't publish`
    );
  }
  for (const action of pluginActions.unrecognized) {
    body.push(
      `release.yml pins ${action} to a branch or commit, so it was left as-is - docs need ${REQUIRED_ACTION_REFS[action]} or later`
    );
  }

  if (agentAssistanceAdded) {
    const readmeMention = readmePresent ? ', mining your README for content' : '';
    body.push(`Using a coding agent? \`/bootstrap-plugin-docs\` drafts the pages from your source${readmeMention}`);
  }

  if (unlinkedAgentFiles.length > 0) {
    const names = unlinkedAgentFiles.map((file) => `\`${file}\``);
    const isSingle = names.length === 1;
    const subject = isSingle ? `${names[0]} doesn't` : `${names.slice(0, -1).join(', ')} and ${names.at(-1)} don't`;
    body.push(
      `${subject} point at ${INSTRUCTIONS_PATH}, so agents reading ${isSingle ? 'it' : 'them'} won't find ${docsPath}/AGENTS.md - add a reference to ${INSTRUCTIONS_PATH}`
    );
  }

  body.push(`Preview with \`${packageManagerName} run docs:serve\``);
  return { level: 'log', title: 'Next steps', body };
}

// readJsonFile doesn't check the shape, so reject JSON that parses but isn't an object
function readPluginJson(context: Context): PluginJson {
  const parsed = readJsonFile<PluginJson>(context, 'src/plugin.json');
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('src/plugin.json does not contain a JSON object.');
  }
  return parsed;
}

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
  // a replacer function, so a value containing `$&` is inserted literally
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

const INSTRUCTIONS_PATH = '.config/AGENTS/instructions.md';
// each agent reads only its own skills dir and SKILL.md can't import, so every dir gets a full copy
const SKILLS_TEMPLATE_PREFIX = 'skills/';
const SKILL_TARGET_DIRS = ['.claude/skills', '.agents/skills', '.codex/skills'];
const BOOTSTRAP_SKILL_NAME = 'bootstrap-plugin-docs';
const ROOT_AGENT_FILES = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md'];
// instructions.md imports e2e-testing.md, so the two are created together
const CONFIG_AGENT_FILES = ['instructions.md', 'e2e-testing.md'];

function anyAgentFileExists(context: Context): boolean {
  return SKILL_TARGET_DIRS.some((dir) => context.doesFileExist(`${dir}/${BOOTSTRAP_SKILL_NAME}/SKILL.md`));
}

// `agent/skills/<name>/` fans out to every SKILL_TARGET_DIRS entry, other files keep their path
function copyAgentTemplates(context: Context, templateDir: string, substitutions: Record<string, string>): void {
  const agentTemplateDir = join(templateDir, 'agent');
  if (!existsSync(agentTemplateDir)) {
    throw new Error(
      `Cannot find agent templates at ${agentTemplateDir}. This is a bug in @grafana/create-plugin - please report it.`
    );
  }
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
    }
  }
}

/**
 * Creates the root agent files a plugin is missing and returns the existing ones that never reach
 * `.config/AGENTS/instructions.md`, directly or through an `AGENTS.md` that does.
 */
function ensureRootAgentFiles(context: Context): string[] {
  const existing = ROOT_AGENT_FILES.filter((file) => context.doesFileExist(file));
  for (const file of ROOT_AGENT_FILES) {
    if (!existing.includes(file)) {
      context.addFile(file, readTemplate(TEMPLATE_PATHS.common, file));
    }
  }

  const reachesInstructions = (file: string): boolean => {
    const content = context.getFile(file) ?? '';
    if (content.includes(INSTRUCTIONS_PATH)) {
      return true;
    }
    // `@AGENTS.md` or `./AGENTS.md`, but not `docs/AGENTS.md`
    return file !== 'AGENTS.md' && /(^|[\s@(])(\.\/)?AGENTS\.md/m.test(content) && reachesInstructions('AGENTS.md');
  };
  return existing.filter((file) => !reachesInstructions(file));
}

function ensureConfigAgentFiles(context: Context, data: { pluginType?: string; packageManagerName: string }): void {
  if (context.doesFileExist(INSTRUCTIONS_PATH)) {
    return;
  }
  for (const file of CONFIG_AGENT_FILES) {
    const targetPath = `.config/AGENTS/${file}`;
    if (context.doesFileExist(targetPath)) {
      additionsDebug(`${targetPath} already exists, skipping`);
      continue;
    }
    context.addFile(targetPath, renderHandlebarsTemplate(readTemplate(TEMPLATE_PATHS.common, targetPath), data));
  }
}

function appendDocsPointerToInstructions(context: Context, docsPath: string): void {
  const existing = context.getFile(INSTRUCTIONS_PATH) ?? '';
  const agentsPath = `${docsPath}/AGENTS.md`;
  if (existing.includes(agentsPath)) {
    additionsDebug(`${INSTRUCTIONS_PATH} already points at ${agentsPath}, skipping`);
    return;
  }
  const separator = existing.endsWith('\n') ? '\n' : '\n\n';
  // a link rather than an @-import, so the docs guidance only loads when an agent works in the docs folder
  const section = `## Documentation\n\nWhenever you add, remove or change a feature in the plugin, you must update the plugin documentation under \`${docsPath}/\`. Refer to [\`${agentsPath}\`](./${agentsPath}) for instructions.\n`;
  context.updateFile(INSTRUCTIONS_PATH, `${existing}${separator}${section}`);
}

// plugins without a `packageManager` field fall back to the lockfile, like getPackageManagerWithFallback
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

const RELEASE_WORKFLOW_PATH = '.github/workflows/release.yml';
// the oldest release of each action that builds docs into the plugin archive
const REQUIRED_ACTION_REFS: Record<string, string> = {
  'grafana/plugin-actions/build-plugin': 'build-plugin/v1.2.0',
  'grafana/plugin-actions/package-plugin': 'package-plugin/v1.3.3',
};

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
    // plugin-validator never passes --allow-unfilled-stubs, so unfilled briefs still block a release
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
