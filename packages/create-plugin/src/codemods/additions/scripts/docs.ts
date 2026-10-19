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
import * as recast from 'recast';
import * as babelTsParser from 'recast/parsers/babel-ts.js';

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
const SUPPORTED_PLUGIN_TYPES = ['panel', 'datasource', 'app'] as const;
type SupportedPluginType = (typeof SUPPORTED_PLUGIN_TYPES)[number];

export default function docs(context: Context, options: Options): Context {
  const pluginType = assertSupportedPluginType(context);
  return setupDocsScaffolding({
    context,
    docsPath: options.docsPath,
    // `templates/docs` is left out of TEMPLATE_PATHS so `generate` ignores it
    templateDir: join(TEMPLATES_DIR, 'docs', pluginType),
    commonTemplateDir: join(TEMPLATES_DIR, 'docs', 'common'),
    featurePages: FEATURE_PAGES_BY_TYPE[pluginType],
    pageStubs: pluginType === 'app' ? getAppFeaturePageStubs : undefined,
  });
}

interface PluginJson {
  type?: string;
  name?: string;
  id?: string;
  docsPath?: string;
  annotations?: boolean;
  alerting?: boolean;
  includes?: PluginInclude[];
  roles?: unknown;
  iam?: unknown;
  [key: string]: unknown;
}

interface PluginInclude {
  type?: string;
  name?: string;
  path?: string;
  role?: string;
  action?: string;
  defaultNav?: boolean;
}

export interface DocsSetupOptions {
  context: Context;
  /** Falls back to the docsPath in `src/plugin.json`, then to `catalog-docs`. */
  docsPath?: string;
  /** Templates specific to this plugin type, under `templates/docs/<type>/`. */
  templateDir: string;
  /** Templates shared by every plugin type, under `templates/docs/common/`. */
  commonTemplateDir: string;
  /** Pages scaffolded only when `src/plugin.json` declares the feature they document. */
  featurePages?: FeaturePage[];
  /** Pages rendered from one template per entry, such as a page for each app page in `src/plugin.json`. */
  /** Gets each feature page's `templateFlag`, so the stubs agree with the pages scaffolded for those features. */
  pageStubs?: (pluginJson: PluginJson, featureFlags: Record<string, boolean>) => PageStubs;
}

interface FeaturePage {
  /** Page name without `.md`. Plugin-docs-cli also accepts it as a folder of that name. */
  page: string;
  templateFlag: string;
  hasFeature: (pluginJson: PluginJson, context: Context) => boolean;
}

interface PageStubs {
  /** Rendered into the template data of every page, so the fixed pages can link to the stubs. */
  data: Record<string, unknown>;
  stubs: PageStub[];
  /** Entries in `src/plugin.json` that get no page, as `name (path)`. */
  skipped: string[];
}

interface PageStub {
  templatePath: string;
  /** Relative to the docs folder. */
  file: string;
  /** Set for a page of the app, which a re-run finds in either layout and as a file or a folder. */
  slug?: string;
  data: Record<string, unknown>;
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
  const featurePages = (opts.featurePages ?? []).map(({ page, templateFlag, hasFeature }) => ({
    page,
    templateFlag,
    isEnabled: hasFeature(pluginJson, context),
  }));
  const featureFlags = Object.fromEntries(featurePages.map(({ templateFlag, isEnabled }) => [templateFlag, isEnabled]));
  const pageStubs = opts.pageStubs?.(pluginJson, featureFlags) ?? { data: {}, stubs: [], skipped: [] };
  const { packageManagerName, packageManagerVersion } = templateData;
  const createPluginCmd = `${getPackageManagerExecCmd(packageManagerName, packageManagerVersion)}@latest`;
  const data = {
    ...templateData,
    pluginId,
    docsPath,
    createPluginCmd,
    lockFile: LOCK_FILES[packageManagerName],
    ...featureFlags,
    ...pageStubs.data,
  };

  addDependenciesToPackageJson(context, {}, { '@grafana/plugin-docs-cli': PLUGIN_DOCS_CLI_VERSION });

  addDocsScripts(context);

  // pages are only rendered into a folder without any, so pages the author deleted stay deleted
  const hasPages = hasDocsPages(context, docsPath);
  const disabledPageFiles = featurePages.filter(({ isEnabled }) => !isEnabled).map(({ page }) => `${page}.md`);
  addTemplateFolder(context, {
    folderPath: join(templateDir, 'docs'),
    targetPath: docsPath,
    data,
    include: (file) => SCAFFOLD_META_FILES.includes(file) || (!hasPages && !disabledPageFiles.includes(file)),
  });
  const missingPageStubs: string[] = [];
  for (const stub of pageStubs.stubs) {
    const filePath = `${docsPath}/${stub.file}`;
    if (hasPages) {
      // the author may have moved the pages between the root and features/ since the first scaffold
      const isMissing =
        stub.slug !== undefined &&
        [stub.slug, `features/${stub.slug}`].every(
          (name) => !context.doesFileExist(`${docsPath}/${name}.md`) && !context.doesFileExist(`${docsPath}/${name}`)
        );
      if (isMissing) {
        missingPageStubs.push(filePath);
      }
    } else if (context.doesFileExist(filePath)) {
      additionsDebug(`${filePath} already exists, skipping`);
    } else {
      context.addFile(filePath, renderTemplate(stub.templatePath, false, { ...data, ...stub.data }));
    }
  }
  // a feature turned on after the first scaffold gets no page, so point the author at it instead
  const missingFeaturePages = hasPages
    ? featurePages
        .filter(
          ({ page, isEnabled }) =>
            isEnabled &&
            !context.doesFileExist(`${docsPath}/${page}.md`) &&
            !context.doesFileExist(`${docsPath}/${page}`)
        )
        .map(({ page }) => `${page}.md`)
    : [];

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

  // deferred so it prints after the runner's change list, and only when there is something to report
  const skippedPages = hasPages ? [] : pageStubs.skipped;
  if (context.hasChanges() || missingFeaturePages.length > 0 || missingPageStubs.length > 0) {
    context.setMessage(
      buildNextStepsMessage({
        docsPath,
        packageManagerName,
        createPluginCmd,
        pluginActions,
        linkedRootFiles,
        missingFeaturePages,
        missingPageStubs,
        skippedPages,
      })
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
  missingFeaturePages: string[];
  missingPageStubs: string[];
  skippedPages: string[];
}): ContextMessage {
  const { docsPath, packageManagerName, createPluginCmd, pluginActions, linkedRootFiles, missingFeaturePages } = opts;
  const { missingPageStubs, skippedPages } = opts;
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
  for (const page of missingFeaturePages) {
    warnings.push({
      title: `src/plugin.json declares the feature ${docsPath}/${page} documents, but the page doesn't exist`,
      detail: `If it needs docs, add the page as described under Optional pages in ${docsPath}/AGENTS.md. If you deleted it on purpose, ignore this.`,
    });
  }
  if (missingPageStubs.length > 0) {
    warnings.push({
      title: `src/plugin.json has pages with no docs page, such as ${missingPageStubs[0]}`,
      detail: `If they need docs, add them as described under Optional pages in ${docsPath}/AGENTS.md. If you deleted them on purpose, ignore this.`,
    });
  }
  if (skippedPages.length > 0) {
    warnings.push({
      title: `Left out of the docs: ${skippedPages.join(', ')}`,
      detail: `If they need docs, add them as described under Optional pages in ${docsPath}/AGENTS.md.`,
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
const DASHBOARDS_PAGE: FeaturePage = {
  page: 'dashboards',
  templateFlag: 'hasDashboards',
  hasFeature: (p) => getIncludes(p).some((i) => i.type === 'dashboard'),
};
const FEATURE_PAGES_BY_TYPE: Record<SupportedPluginType, FeaturePage[]> = {
  panel: [],
  datasource: [
    { page: 'annotations', templateFlag: 'hasAnnotations', hasFeature: (p) => p.annotations === true },
    { page: 'alerting', templateFlag: 'hasAlerting', hasFeature: (p) => p.alerting === true },
    DASHBOARDS_PAGE,
  ],
  app: [
    { page: 'configure', templateFlag: 'hasConfigPage', hasFeature: hasAppConfigPage },
    DASHBOARDS_PAGE,
    {
      page: 'permissions',
      templateFlag: 'hasPermissions',
      hasFeature: (p) =>
        p.roles !== undefined ||
        p.iam !== undefined ||
        getIncludes(p).some((i) => (i.role !== undefined && i.role !== 'Viewer') || i.action !== undefined),
    },
  ],
};

function getIncludes(pluginJson: PluginJson): PluginInclude[] {
  return Array.isArray(pluginJson.includes)
    ? pluginJson.includes.filter((i): i is PluginInclude => typeof i === 'object' && i !== null)
    : [];
}

// app page paths may use the %PLUGIN_ID% placeholder that the build replaces
function isAppPath(path: string | undefined, pluginId: string | undefined, prefix: string): boolean {
  return [pluginId, '%PLUGIN_ID%'].some(
    (id) => id && (path === `${prefix}${id}` || path?.startsWith(`${prefix}${id}/`))
  );
}

const APP_MODULE_FILES = ['src/module.ts', 'src/module.tsx', 'src/module.js', 'src/module.jsx'];

function hasAppConfigPage(pluginJson: PluginJson, context: Context): boolean {
  return (
    APP_MODULE_FILES.some((file) => callsAddConfigPage(context.getFile(file))) ||
    getIncludes(pluginJson).some((i) => i.type === 'page' && isAppPath(i.path, pluginJson.id, '/plugins/'))
  );
}

function callsAddConfigPage(source: string | undefined): boolean {
  if (!source) {
    return false;
  }
  // babel-ts parses JSX as well as TypeScript, since app modules are often .tsx
  let ast: recast.types.ASTNode;
  try {
    ast = recast.parse(source, { parser: babelTsParser });
  } catch (error) {
    additionsDebug(`Failed to parse the app module, so it can't tell whether it has a config page: ${error}`);
    return false;
  }
  let isFound = false;
  recast.visit(ast, {
    visitCallExpression(path) {
      const { callee } = path.node;
      if (
        callee.type === 'MemberExpression' &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 'addConfigPage'
      ) {
        isFound = true;
        return false;
      }
      this.traverse(path);
      return undefined;
    },
  });
  return isFound;
}

// the example pages templates/app/src/plugin.json ships, which only document the scaffold
const TEMPLATE_DEFAULT_PAGES: Record<string, string> = {
  'Page One': '/one',
  'Page Two': '/two',
  'Page Three': '/three',
  'Page Four': '/four',
};

const CONFIG_PAGE_SLUGS = ['configuration', 'configure'];

interface AppFeaturePage {
  name: string;
  slug: string;
  path: string;
  role?: string;
}

// pages under /plugins/ are the config page and pages under /d/ link to a bundled dashboard, so neither gets a page
function getAppFeaturePages(
  pluginJson: PluginJson,
  hasConfigPage: boolean
): { pages: AppFeaturePage[]; configPage?: AppFeaturePage; skipped: string[] } {
  const pages: AppFeaturePage[] = [];
  let configPage: AppFeaturePage | undefined;
  const skipped: string[] = [];
  const appPages = getIncludes(pluginJson)
    .filter((i) => i.type === 'page' && typeof i.name === 'string' && isAppPath(i.path, pluginJson.id, '/a/'))
    .sort((a, b) => Number(b.defaultNav === true) - Number(a.defaultNav === true));
  const takenSlugs = new Set(getReservedPageSlugs());
  for (const include of appPages) {
    const name = include.name as string;
    const path = (include.path as string).replaceAll('%PLUGIN_ID%', pluginJson.id ?? '');
    const defaultPath = TEMPLATE_DEFAULT_PAGES[name];
    if (defaultPath !== undefined && path.endsWith(defaultPath)) {
      additionsDebug(`${name} is an example page from the create-plugin app template, skipping`);
      skipped.push(`${name} (${include.path}, an example page from the create-plugin app template)`);
      continue;
    }
    const slug = slugify(name);
    if (!slug) {
      additionsDebug(`${name} has no letters or digits for a file name, skipping`);
      skipped.push(`${name} (${include.path}, its name has no letters or digits for a file name)`);
      continue;
    }
    // Viewer is the lowest role, so a page that needs only that has nothing to tell the reader
    const role = typeof include.role === 'string' && include.role !== 'Viewer' ? include.role : undefined;
    // an in-app page named like the config page takes its place, the way data sources name it
    if (!hasConfigPage && !configPage && CONFIG_PAGE_SLUGS.includes(slug)) {
      configPage = { name, slug: 'configure', path, role };
      continue;
    }
    if (takenSlugs.has(slug)) {
      additionsDebug(`${name} would be written to ${slug}.md, which another page uses, skipping`);
      skipped.push(`${name} (${include.path}, its file name is used by another page)`);
      continue;
    }
    takenSlugs.add(slug);
    pages.push({ name, slug, path, role });
  }
  return { pages, configPage, skipped };
}

function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// more app pages than this go in a features/ folder, so a small app has no folder with one page in it
const MAX_FLAT_PAGES = 3;
// the root pages that come before the app pages, which take the positions after it
const FIRST_PAGE_POSITION = 3;
const CONFIG_PAGE_POSITION = 2;
const FIXED_PAGE_SLUGS = ['index', 'configure', 'dashboards', 'permissions', 'troubleshooting'];

// file names an app page can't take, because another page or plugin-docs-cli uses them
function getReservedPageSlugs(): string[] {
  return [
    ...FIXED_PAGE_SLUGS,
    ...DOCS_CLI_META_FILES.map((file) => file.slice(0, -'.MD'.length).toLowerCase().replaceAll('_', '-')),
  ];
}

function getAppFeaturePageStubs(pluginJson: PluginJson, featureFlags: Record<string, boolean>): PageStubs {
  const { pages, configPage, skipped } = getAppFeaturePages(pluginJson, featureFlags.hasConfigPage === true);
  const templateDir = join(TEMPLATES_DIR, 'docs', 'app');
  const pageTemplate = join(templateDir, 'feature-page.md');
  const stubs: PageStub[] = [];
  if (configPage) {
    stubs.push({
      templatePath: pageTemplate,
      file: 'configure.md',
      slug: 'configure',
      data: { page: { ...configPage, position: CONFIG_PAGE_POSITION } },
    });
  }

  const isInFolder = pages.length > MAX_FLAT_PAGES;
  const folder = isInFolder ? 'features/' : '';
  if (isInFolder) {
    stubs.push({
      templatePath: join(templateDir, 'features-index.md'),
      file: 'features/index.md',
      data: { position: FIRST_PAGE_POSITION },
    });
  }
  // plugin-docs-cli compares a folder's index.md with the pages inside it, so these start after it
  const firstPosition = isInFolder ? FIRST_PAGE_POSITION + 1 : FIRST_PAGE_POSITION;
  pages.forEach((page, i) => {
    stubs.push({
      templatePath: pageTemplate,
      file: `${folder}${page.slug}.md`,
      slug: page.slug,
      data: { page: { ...page, position: firstPosition + i } },
    });
  });

  return {
    data: {
      ...(configPage ? { hasConfigPage: true } : {}),
      ...(pages.length > 0 ? { defaultFeaturePage: { ...pages[0], file: `${folder}${pages[0].slug}` } } : {}),
    },
    stubs,
    skipped,
  };
}

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
