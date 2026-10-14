import { join } from 'node:path';
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
import { appendToAgentInstructions, ensureConfigAgentFiles, ensureRootAgentFiles } from '../../utils.agents.js';
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
        'docsPath must be a relative path of letters, digits, hyphens, underscores and single "/" separators (for example "catalog-docs" or "docs/plugin"), with no leading "/", "./", trailing "/", ".." segment, backslash or quote character.'
      )
    ),
    'catalog-docs'
  ),
});

type Options = v.InferOutput<typeof schema>;

// kept current by a Renovate custom manager in .github/renovate.json, which matches this exact line
const PLUGIN_DOCS_CLI_VERSION = '^0.7.0';

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
  const pluginJson = readJsonFile<PluginJson>(context, 'src/plugin.json');
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

  const data = { ...getTemplateDataFromContext(context), pluginId, docsPath };
  const { packageManagerName } = data;

  // step 3: add @grafana/plugin-docs-cli as a devDependency
  addDependenciesToPackageJson(context, {}, { '@grafana/plugin-docs-cli': PLUGIN_DOCS_CLI_VERSION });

  // step 4: add docs:serve and docs:validate npm scripts
  addDocsScripts(context);

  // step 5: render the docs pages into the docs folder (includes README.md)
  addTemplateFolder(context, { folderPath: join(templateDir, 'docs'), targetPath: docsPath, data });

  // step 6: copy validate-docs workflow, unless the user already customized one
  const workflowPath = '.github/workflows/validate-docs.yml';
  if (!context.doesFileExist(workflowPath)) {
    context.addFile(workflowPath, renderTemplate(join(commonTemplateDir, 'workflows/validate-docs.yml'), false, data));
  } else {
    additionsDebug(`${workflowPath} already exists, skipping`);
  }

  // step 7: bump build-plugin and package-plugin in release.yml to versions that build docs
  const pluginActions = bumpActionRefs(context, RELEASE_WORKFLOW_PATH, REQUIRED_ACTION_REFS);

  // step 8: agent instructions, creating the root and .config/AGENTS files a plugin predating them lacks
  ensureRootAgentFiles(context, TEMPLATE_PATHS.common);
  ensureConfigAgentFiles(context, TEMPLATE_PATHS.common, CONFIG_AGENT_FILES, data);
  appendDocsPointerToInstructions(context, docsPath);

  // step 9: deferred so it prints after the runner's change list, and only when something changed
  if (context.hasChanges()) {
    context.setMessage(buildNextStepsMessage({ docsPath, packageManagerName, pluginActions }));
  }

  return context;
}

function buildNextStepsMessage(opts: {
  docsPath: string;
  packageManagerName: string;
  pluginActions: BumpActionRefsResult;
}): ContextMessage {
  const { docsPath, packageManagerName, pluginActions } = opts;
  const run = (script: string) => output.formatCode(`${packageManagerName} run ${script}`);

  const steps: NextStep[] = [
    {
      title: `Read ${docsPath}/README.md`,
      detail: 'It has the commands and a link to the plugin docs guide.',
    },
    {
      title: `Fill in or review the pages under ${docsPath}/`,
      detail: `Preview them with ${run('docs:serve')}, which also warns about every section left to fill.`,
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

  const body = steps.flatMap((step, i) => formatNextStep(step, ` ${i + 1}. `));
  if (warnings.length > 0) {
    body.push('', 'Needs your attention:', ...warnings.flatMap((warning) => formatNextStep(warning, ' ! ')));
  }
  return { level: 'log', title: 'Next steps', body };
}

interface NextStep {
  title: string;
  detail?: string;
}

function formatNextStep({ title, detail }: NextStep, marker: string): string[] {
  const lines = [`${marker}${title}`];
  if (detail) {
    lines.push(`${' '.repeat(marker.length)}${detail}`);
  }
  return lines;
}

export function assertSupportedPluginType(context: Context): SupportedPluginType {
  const { type } = readJsonFile<PluginJson>(context, 'src/plugin.json');

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

// instructions.md imports e2e-testing.md, so the two are created together
const CONFIG_AGENT_FILES = ['instructions.md', 'e2e-testing.md'];

function appendDocsPointerToInstructions(context: Context, docsPath: string): void {
  const agentsPath = `${docsPath}/AGENTS.md`;
  // a link rather than an @-import, so the docs guidance only loads when an agent works in the docs folder
  const section = `## Plugin docs\n\nWhenever you add, remove or change a feature in the plugin, you must update the plugin documentation under \`${docsPath}/\`. Refer to [\`${agentsPath}\`](./${agentsPath}) for instructions.\n`;
  appendToAgentInstructions(context, agentsPath, section);
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
    scripts['docs:validate'] = 'plugin-docs-cli validate';
    changed = true;
  } else {
    additionsDebug('docs:validate already exists in package.json scripts, skipping');
  }

  if (changed) {
    context.updateFile('package.json', JSON.stringify({ ...packageJson, scripts }, null, 2));
  }
}
