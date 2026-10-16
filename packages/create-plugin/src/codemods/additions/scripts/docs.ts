import { basename, join } from 'node:path';
import * as v from 'valibot';
import type { Context, ContextMessage } from '../../context.js';
import { TEMPLATE_PATHS, TEMPLATES_DIR } from '../../../constants.js';
import { output } from '../../../utils/utils.console.js';
import {
  additionsDebug,
  addDependenciesToPackageJson,
  addTemplateFolder,
  getTemplateDataFromContext,
  readJsonFile,
  renderTemplate,
} from '../../utils.js';
import {
  AGENT_INSTRUCTIONS_PATH,
  appendToAgentInstructions,
  ensureConfigAgentFiles,
  ensureRootAgentFiles,
} from '../../utils.agents.js';
import { type BumpActionRefsResult, bumpActionRefs } from '../../utils.workflows.js';
import { getPackageManagerExecCmd } from '../../../utils/utils.packageManager.js';

// an allowlist, because the value becomes a path on disk and is embedded unescaped in a YAML workflow
const DOCS_PATH_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]|\/[a-zA-Z0-9_-])*$/;
const DOCS_PATH_RULE =
  'a relative path of letters, digits, hyphens, underscores and single "/" separators (for example "catalog-docs" or "docs/plugin")';
const DEFAULT_DOCS_PATH = 'catalog-docs';

export function isValidDocsPath(value: unknown): value is string {
  return typeof value === 'string' && DOCS_PATH_RE.test(value);
}

export function assertValidDocsPath(value: unknown, command: string, nextStep: string): asserts value is string {
  if (!isValidDocsPath(value)) {
    throw new Error(
      `src/plugin.json has docsPath set to '${value}', which create-plugin ${command} can't use.\n  Change it to ${DOCS_PATH_RULE}, then ${nextStep}.`
    );
  }
}

export const schema = v.object({
  docsPath: v.optional(
    v.pipe(
      v.string(),
      v.minLength(1, 'docsPath must not be empty.'),
      v.regex(
        DOCS_PATH_RE,
        `docsPath must be ${DOCS_PATH_RULE}, with no leading "/", "./", trailing "/", ".." segment, backslash or quote character.`
      )
    )
  ),
});

type Options = v.InferOutput<typeof schema>;

// kept current by a Renovate custom manager in .github/renovate.json, which matches this exact line
const PLUGIN_DOCS_CLI_VERSION = '^0.8.0';

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
  /** Falls back to the docsPath in `src/plugin.json`, then to `catalog-docs`. */
  docsPath?: string;
  /** Templates specific to this plugin type, under `templates/docs/<type>/`. */
  templateDir: string;
  /** Templates shared by every plugin type, under `templates/docs/common/`. */
  commonTemplateDir: string;
}

export function setupDocsScaffolding(opts: DocsSetupOptions): Context {
  const { context, templateDir, commonTemplateDir } = opts;

  const pluginJson = readJsonFile<PluginJson>(context, 'src/plugin.json');
  const existingDocsPath = pluginJson.docsPath;

  if (existingDocsPath !== undefined) {
    assertValidDocsPath(existingDocsPath, 'add docs', 'run this again');
  }

  if (opts.docsPath !== undefined && existingDocsPath !== undefined && existingDocsPath !== opts.docsPath) {
    throw new Error(
      `src/plugin.json already has docsPath set to '${existingDocsPath}'.\n  Re-run with the existing path:\n  create-plugin add docs --docsPath ${existingDocsPath}`
    );
  }

  const docsPath = opts.docsPath ?? existingDocsPath ?? DEFAULT_DOCS_PATH;

  // a folder plugin.json doesn't declare isn't ours. doesFileExistOnDisk also catches an empty directory
  if (existingDocsPath === undefined && context.doesFileExistOnDisk(docsPath)) {
    throw new Error(
      `A directory already exists at '${docsPath}' but src/plugin.json has no docsPath.\n  Point the plugin at it by setting "docsPath": "${docsPath}" in src/plugin.json, or scaffold elsewhere:\n  create-plugin add docs --docsPath <alternative-path>`
    );
  }

  if (!pluginJson.name) {
    throw new Error('src/plugin.json has no "name". Add one - it is used as the title throughout the docs.');
  }
  if (!pluginJson.id) {
    throw new Error('src/plugin.json has no "id". Add one - it is used in the catalog links throughout the docs.');
  }
  const pluginId = pluginJson.id;

  // only rewritten when docsPath changes, so re-runs don't reformat plugin.json
  if (existingDocsPath !== docsPath) {
    context.updateFile('src/plugin.json', JSON.stringify({ ...pluginJson, docsPath }, null, 2));
  }

  const templateData = getTemplateDataFromContext(context);
  const { packageManagerName, packageManagerVersion } = templateData;
  const createPluginCmd = `${getPackageManagerExecCmd(packageManagerName, packageManagerVersion)}@latest`;
  const data = {
    ...templateData,
    pluginId,
    docsPath,
    createPluginCmd,
    lockFile: LOCK_FILES[packageManagerName],
  };

  addDependenciesToPackageJson(context, {}, { '@grafana/plugin-docs-cli': PLUGIN_DOCS_CLI_VERSION });

  addDocsScripts(context);

  // pages are only rendered into a folder without any, so pages the author deleted stay deleted
  const hasPages = hasDocsPages(context, docsPath);
  addTemplateFolder(context, {
    folderPath: join(templateDir, 'docs'),
    targetPath: docsPath,
    data,
    include: (file) => !hasPages || SCAFFOLD_META_FILES.includes(file),
  });

  // left alone when it exists, since the author may have customized it
  const workflowPath = '.github/workflows/validate-docs.yml';
  if (!context.doesFileExist(workflowPath)) {
    context.addFile(workflowPath, renderTemplate(join(commonTemplateDir, 'workflows/validate-docs.yml'), false, data));
  } else {
    additionsDebug(`${workflowPath} already exists, skipping`);
  }

  const pluginActions = bumpActionRefs(context, RELEASE_WORKFLOW_PATH, REQUIRED_ACTION_REFS);

  // a plugin that predates the root and .config/AGENTS files gets them here
  const linkedRootFiles = ensureRootAgentFiles(context, TEMPLATE_PATHS.common);
  ensureConfigAgentFiles(context, TEMPLATE_PATHS.common, CONFIG_AGENT_FILES, data);
  appendDocsPointerToInstructions(context, docsPath);

  // deferred so it prints after the runner's change list, and only when something changed
  if (context.hasChanges()) {
    context.setMessage(
      buildNextStepsMessage({ docsPath, packageManagerName, createPluginCmd, pluginActions, linkedRootFiles })
    );
  }

  return context;
}

function buildNextStepsMessage(opts: {
  docsPath: string;
  packageManagerName: string;
  createPluginCmd: string;
  pluginActions: BumpActionRefsResult;
  linkedRootFiles: string[];
}): ContextMessage {
  const { docsPath, packageManagerName, createPluginCmd, pluginActions, linkedRootFiles } = opts;
  const run = (script: string) => output.formatCode(`${packageManagerName} run ${script}`);

  const steps: NextStep[] = [
    {
      title: `Read ${docsPath}/README.md`,
      detail: 'It has the commands and a link to the plugin docs guide.',
    },
    {
      title: 'Write the pages, yourself or with an AI agent',
      detail: [
        `Fill in or review the pages under ${docsPath}/ by hand.`,
        'Or commit these changes, then have an agent draft them from your source code and README:',
        output.formatCode(`${createPluginCmd} add docs-content`),
        'Review its work either way.',
      ],
    },
    {
      title: 'Preview the pages',
      detail: `Run ${run('docs:serve')}, which also lists every section left to fill.`,
    },
  ];

  const warnings: NextStep[] = [];
  if (pluginActions.found.length === 0) {
    warnings.push({
      title: `No build-plugin or package-plugin step found in ${RELEASE_WORKFLOW_PATH}`,
      detail: `Make sure your release pipeline builds ${docsPath}/ into the plugin archive, or the docs won't publish.`,
    });
  }
  for (const action of pluginActions.unrecognized) {
    warnings.push({
      title: `${RELEASE_WORKFLOW_PATH} pins ${action} to a branch or commit, so it was left as is`,
      detail: `Docs need ${REQUIRED_ACTION_REFS[action]} or later.`,
    });
  }
  for (const file of linkedRootFiles) {
    warnings.push({
      title: `Added a pointer to ${AGENT_INSTRUCTIONS_PATH} at the end of ${file}`,
      detail: 'Agents that read it now also load the plugin instructions. Check it fits with the rest of the file.',
    });
  }

  const body = steps.flatMap((step, i) => formatNextStep(step, ` ${i + 1}. `));
  if (warnings.length > 0) {
    body.push('', 'Needs your attention:', ...warnings.flatMap((warning) => formatNextStep(warning, ' ! ')));
  }
  return { level: 'log', title: 'Next steps', body };
}

interface NextStep {
  title: string;
  detail?: string | string[];
}

function formatNextStep({ title, detail }: NextStep, marker: string): string[] {
  const indent = ' '.repeat(marker.length);
  return [`${marker}${title}`, ...[detail ?? []].flat().map((line) => `${indent}${line}`)];
}

export function assertSupportedPluginType(context: Context, additionName = 'docs'): SupportedPluginType {
  const { type } = readJsonFile<PluginJson>(context, 'src/plugin.json');

  if (isSupportedPluginType(type)) {
    return type;
  }

  const supported = SUPPORTED_PLUGIN_TYPES.join(', ');
  if (type === 'app' || type === 'datasource') {
    throw new Error(
      `create-plugin add ${additionName} does not support '${type}' plugins yet. Supported so far: ${supported}.`
    );
  }
  throw new Error(
    `create-plugin add ${additionName} needs a plugin type of ${supported} in src/plugin.json, but found '${type ?? 'unset'}'.`
  );
}

function isSupportedPluginType(type: string | undefined): type is SupportedPluginType {
  return SUPPORTED_PLUGIN_TYPES.includes(type as SupportedPluginType);
}

// instructions.md imports e2e-testing.md, so the two are created together
const CONFIG_AGENT_FILES = ['instructions.md', 'e2e-testing.md'];
// the scaffold's files that aren't pages, so they're added on every run
const SCAFFOLD_META_FILES = ['README.md', 'AGENTS.md', 'CLAUDE.md'];
// mirrors isMetaFile in @grafana/plugin-docs-cli, so both tools agree on what counts as a page
const DOCS_CLI_META_FILES = [
  'README.MD',
  'CONTRIBUTING.MD',
  'LICENSE.MD',
  'CODE_OF_CONDUCT.MD',
  'SECURITY.MD',
  'CHANGELOG.MD',
  'AGENTS.MD',
  'CLAUDE.MD',
];

export function hasDocsPages(context: Context, docsPath: string): boolean {
  const addedInContext = Object.entries(context.listChanges())
    .filter(([path, change]) => change.changeType === 'add' && path.startsWith(`${docsPath}/`))
    .map(([path]) => path);
  return [...listFiles(context, docsPath), ...addedInContext].some(
    (file) =>
      file.endsWith('.md') &&
      !DOCS_CLI_META_FILES.includes(basename(file).toUpperCase()) &&
      !isInSkippedFolder(file.slice(docsPath.length + 1))
  );
}

// plugin-docs-cli skips these too, and walking node_modules would be slow
const SKIPPED_FOLDERS = ['node_modules', 'dist'];

function isInSkippedFolder(relativePath: string): boolean {
  return relativePath.split('/').some((segment) => SKIPPED_FOLDERS.includes(segment));
}

// readDir gives nothing for a file, so this walks into every entry
function listFiles(context: Context, folder: string): string[] {
  return context
    .readDir(folder)
    .flatMap((entry) => (SKIPPED_FOLDERS.includes(basename(entry)) ? [] : [entry, ...listFiles(context, entry)]));
}

function appendDocsPointerToInstructions(context: Context, docsPath: string): void {
  const agentsPath = `${docsPath}/AGENTS.md`;
  // a link rather than an @-import, so the docs guidance only loads when an agent works in the docs folder
  const section = `## Plugin docs\n\nWhenever you add, remove or change a feature in the plugin, you must update the plugin documentation under \`${docsPath}/\`. Refer to [\`${agentsPath}\`](../../${agentsPath}) for instructions.\n`;
  appendToAgentInstructions(context, agentsPath, section);
}

// so the docs workflow also runs when the docs CLI is bumped
const LOCK_FILES: Record<string, string> = {
  npm: 'package-lock.json',
  pnpm: 'pnpm-lock.yaml',
  yarn: 'yarn.lock',
};

const RELEASE_WORKFLOW_PATH = '.github/workflows/release.yml';
// the oldest release of each action that builds docs into the plugin archive
const REQUIRED_ACTION_REFS: Record<string, string> = {
  'grafana/plugin-actions/build-plugin': 'build-plugin/v1.2.0',
  'grafana/plugin-actions/package-plugin': 'package-plugin/v1.3.3',
};

const DOCS_SCRIPTS: Record<string, string> = {
  'docs:serve': 'plugin-docs-cli serve --port 3001 --reload',
  'docs:validate': 'plugin-docs-cli validate',
};

function addDocsScripts(context: Context): void {
  const packageJson = readJsonFile<Record<string, unknown>>(context, 'package.json');
  const scripts = (packageJson['scripts'] ?? {}) as Record<string, string>;
  const missing = Object.entries(DOCS_SCRIPTS).filter(([name]) => {
    if (scripts[name]) {
      additionsDebug(`${name} already exists in package.json scripts, skipping`);
      return false;
    }
    return true;
  });

  if (missing.length > 0) {
    context.updateFile(
      'package.json',
      JSON.stringify({ ...packageJson, scripts: { ...scripts, ...Object.fromEntries(missing) } }, null, 2)
    );
  }
}
