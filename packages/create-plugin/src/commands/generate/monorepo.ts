import fs from 'node:fs';
import path from 'node:path';
import { kebabCase } from 'change-case';
import { glob } from 'glob';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { TEMPLATE_PATHS } from '../../constants.js';
import { TemplateData } from '../../types.js';
import { getExportFileName, isFile } from '../../utils/utils.files.js';
import { PluginEntry, resolveProject } from '../../utils/utils.project.js';
import { renderTemplateFromFile } from '../../utils/utils.templates.js';

// Files keyed by their path relative to the monorepo root (or, before placement, to the plugin).
export type FileMap = Map<string, string>;

export const PLUGINS_DIR = 'plugins';
const CONFIG_PACKAGE = '@grafana/create-plugin-configs';

// Shared by every plugin, so they live once at the monorepo root.
const ROOT_FILES = ['.nvmrc', '.npmrc', '.prettierrc.js', '.cprc.json'];
const ROOT_DIRS = ['.config', '.claude', '.codex'];
// Replaced by monorepo-specific files at the root.
const REPLACED_FILES = ['pnpm-workspace.yaml', 'docker-compose.yaml', 'AGENTS.md', 'CLAUDE.md', 'GEMINI.md'];
const REPLACED_DIRS = ['.github'];
// Root tooling a yarn berry workspace can only reach with `yarn run -T` (top-level).
const ROOT_TOOL_BINS = ['webpack', 'rspack', 'jest', 'tsc', 'eslint', 'prettier', 'playwright', 'sign-plugin'];

export interface PlacedTemplateAction {
  templateFile: string;
  // Path relative to the plugin root.
  path: string;
  data: TemplateData;
}

export interface SplitPluginFiles {
  rootFiles: FileMap;
  pluginFiles: FileMap;
  provisioningFiles: FileMap;
}

function isUnder(filePath: string, dir: string) {
  return filePath === dir || filePath.startsWith(`${dir}/`);
}

export function renderActions(actions: PlacedTemplateAction[]): FileMap {
  return new Map(actions.map((action) => [action.path, renderTemplateFromFile(action.templateFile, action.data)]));
}

/**
 * Sorts the files rendered for a single plugin into the files shared at the monorepo root, the plugin's own
 * files, and its provisioning (merged into the root provisioning folder).
 */
export function splitPluginFiles(files: FileMap): SplitPluginFiles {
  const rootFiles: FileMap = new Map();
  const pluginFiles: FileMap = new Map();
  const provisioningFiles: FileMap = new Map();

  for (const [filePath, content] of files) {
    if (ROOT_FILES.includes(filePath) || ROOT_DIRS.some((dir) => isUnder(filePath, dir))) {
      rootFiles.set(filePath, content);
    } else if (REPLACED_FILES.includes(filePath) || REPLACED_DIRS.some((dir) => isUnder(filePath, dir))) {
      continue;
    } else if (isUnder(filePath, 'provisioning')) {
      provisioningFiles.set(filePath, content);
    } else if (filePath === '.gitignore') {
      rootFiles.set(filePath, content);
      pluginFiles.set(filePath, content);
    } else {
      pluginFiles.set(filePath, content);
    }
  }

  return { rootFiles, pluginFiles, provisioningFiles };
}

type PackageJson = Record<string, unknown> & {
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function isYarnBerry(templateData: TemplateData) {
  return templateData.packageManagerName === 'yarn' && !templateData.packageManagerVersion.startsWith('1.');
}

// Prefixes commands that run root tooling with `yarn run -T`, so yarn berry finds them from a plugin workspace.
export function useTopLevelBins(script: string): string {
  return script
    .split(/(\s*&&\s*|\s*\|\|\s*)/)
    .map((segment) => {
      const [bin] = segment.trim().split(/\s+/);
      return ROOT_TOOL_BINS.includes(bin) ? segment.replace(bin, `yarn run -T ${bin}`) : segment;
    })
    .join('');
}

/**
 * A plugin in a monorepo keeps its own scripts and runtime dependencies. Tooling devDependencies, the
 * workspace declaration and packageManager move to the root package.json.
 */
export function createPluginPackageJson(pluginPackageJson: PackageJson, templateData: TemplateData): PackageJson {
  const { devDependencies = {}, workspaces, packageManager, ...rest } = pluginPackageJson;
  const configDependency = devDependencies[CONFIG_PACKAGE];
  const scripts = Object.fromEntries(
    Object.entries(rest.scripts ?? {}).map(([name, script]) => [
      name,
      isYarnBerry(templateData) ? useTopLevelBins(script) : script,
    ])
  );
  // Plugins in a monorepo share the Grafana defined at the repository root.
  if (scripts.server) {
    scripts.server = 'docker compose -f ../../docker-compose.yaml up --build';
  }

  return {
    ...rest,
    // Workspace names must be unique, so the plugin id names the package.
    name: templateData.pluginId,
    scripts,
    ...(configDependency ? { devDependencies: { [CONFIG_PACKAGE]: configDependency } } : {}),
  };
}

function getRecursiveScript(templateData: TemplateData, script: string, rootName: string) {
  if (templateData.packageManagerName === 'pnpm') {
    return `pnpm -r --if-present run ${script}`;
  }
  if (templateData.packageManagerName === 'yarn') {
    // --all includes the root workspace, which would run this script again.
    return `yarn workspaces foreach --all --exclude ${rootName} run ${script}`;
  }
  return `npm run ${script} --workspaces --if-present`;
}

export function createRootPackageJson(
  pluginPackageJson: PackageJson,
  templateData: TemplateData,
  rootName: string
): PackageJson {
  const { [CONFIG_PACKAGE]: _configDependency, ...toolingDependencies } = pluginPackageJson.devDependencies ?? {};
  const scripts = Object.fromEntries(
    ['build', 'typecheck', 'lint', 'test:ci', 'e2e'].map((script) => [
      script,
      getRecursiveScript(templateData, script, rootName),
    ])
  );

  return {
    name: rootName,
    version: '1.0.0',
    private: true,
    ...(templateData.packageManagerName === 'pnpm'
      ? {}
      : { workspaces: ['.config', `${PLUGINS_DIR}/*`, 'packages/*'] }),
    scripts: { ...scripts, server: 'docker compose up --build' },
    devDependencies: toolingDependencies,
    packageManager: `${templateData.packageManagerName}@${templateData.packageManagerVersion}`,
  };
}

/**
 * Merges a plugin's provisioning into the shared root provisioning folder, which the root Grafana loads.
 * Dashboards get a folder per plugin; other files get the plugin id as a prefix, and files identical to one
 * already provisioned (for example the shared TestData data source) are skipped.
 */
export function mergeProvisioning(existing: FileMap, pluginProvisioning: FileMap, pluginId: string): FileMap {
  const merged: FileMap = new Map();
  const hasSameContent = (dir: string, content: string) =>
    [...existing, ...merged].some(([filePath, other]) => path.dirname(filePath) === dir && other === content);

  for (const [filePath, content] of pluginProvisioning) {
    const [, kind, ...rest] = filePath.split('/');
    const fileName = rest.join('/');
    if (!kind || !fileName || fileName === 'README.md' || fileName.endsWith('.gitkeep')) {
      continue;
    }

    if (kind === 'dashboards' && /\.ya?ml$/.test(fileName)) {
      const providerPath = '/etc/grafana/provisioning/dashboards';
      merged.set(
        `provisioning/dashboards/${pluginId}.yaml`,
        content.replace(`path: ${providerPath}`, `path: ${providerPath}/${pluginId}`)
      );
      continue;
    }

    if (kind === 'dashboards') {
      merged.set(`provisioning/dashboards/${pluginId}/${fileName}`, content);
      continue;
    }

    const dir = `provisioning/${kind}`;
    if (!hasSameContent(dir, content)) {
      merged.set(`${dir}/${pluginId}-${fileName}`, content);
    }
  }

  return merged;
}

/**
 * One Grafana for the whole monorepo, built from the shared .config Dockerfile, loading every plugin's dist.
 */
export function createComposeFile(composeBase: string, plugins: PluginEntry[], rootName: string): string {
  const base = parseYaml(composeBase) ?? {};
  const baseArgs = base?.services?.grafana?.build?.args ?? {};
  const pluginIds = plugins.map((plugin) => plugin.id ?? path.basename(plugin.dir));

  const compose = {
    services: {
      grafana: {
        user: 'root',
        container_name: rootName,
        build: {
          context: './.config',
          // The shared container runs Grafana only; build and debug backends with mage from each plugin.
          args: { ...baseArgs, development: 'false' },
        },
        ports: ['3000:3000/tcp'],
        volumes: [
          ...plugins.map((plugin, index) => `./${plugin.dir}/dist:/var/lib/grafana/plugins/${pluginIds[index]}`),
          './provisioning:/etc/grafana/provisioning',
        ],
        environment: {
          NODE_ENV: 'development',
          GF_LOG_FILTERS: pluginIds.map((id) => `plugin.${id}:debug`).join(' '),
          GF_LOG_LEVEL: 'debug',
          GF_DATAPROXY_LOGGING: 1,
          GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS: pluginIds.join(','),
        },
      },
    },
  };

  return stringifyYaml(compose);
}

interface ReleasePleaseFiles {
  config: string;
  manifest: string;
}

// Registers a plugin with release-please: one component per plugin, tagged <plugin-id>-v<version>.
export function addToReleasePlease(
  existing: Partial<ReleasePleaseFiles>,
  pluginDir: string,
  pluginId: string,
  version: string
): ReleasePleaseFiles {
  const config = existing.config
    ? JSON.parse(existing.config)
    : {
        $schema: 'https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json',
        'include-component-in-tag': true,
        'bump-minor-pre-major': true,
        packages: {},
      };
  const manifest = existing.manifest ? JSON.parse(existing.manifest) : {};

  config.packages = { ...config.packages, [pluginDir]: { 'release-type': 'node', component: pluginId } };
  // The release-please starting point is the version the plugin is published with.
  manifest[pluginDir] = manifest[pluginDir] ?? version;

  return {
    config: `${JSON.stringify(config, null, 2)}\n`,
    manifest: `${JSON.stringify(manifest, null, 2)}\n`,
  };
}

export function renderMonorepoTemplates(templateData: TemplateData): FileMap {
  const files: FileMap = new Map();
  const templates = glob.sync(`${TEMPLATE_PATHS.monorepo}/**`, { dot: true }).filter(isFile);

  for (const templateFile of templates) {
    const relativePath = path.relative(TEMPLATE_PATHS.monorepo, templateFile);
    const exportDir = path.dirname(relativePath).replace(/^github(?=\/|$)/, '.github');
    const exportPath = path.join(exportDir, getExportFileName(templateFile));
    files.set(path.normalize(exportPath), renderTemplateFromFile(templateFile, templateData));
  }

  // Claude Code and Gemini read their own instruction files, which share the root AGENTS.md content.
  const agents = files.get('AGENTS.md');
  if (agents) {
    files.set('CLAUDE.md', agents);
    files.set('GEMINI.md', agents);
  }

  return files;
}

const PLUGIN_AGENTS = `## Project knowledge
This **Grafana plugin** is part of a plugin monorepo. You must Read @../../AGENTS.md before doing changes.
`;

function readFileIfExists(filePath: string): string | undefined {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : undefined;
}

function readDirFiles(root: string, dir: string): FileMap {
  const files: FileMap = new Map();
  if (!fs.existsSync(path.join(root, dir))) {
    return files;
  }
  for (const filePath of glob.sync(`${dir}/**`, { cwd: root, dot: true, nodir: true })) {
    files.set(filePath, fs.readFileSync(path.join(root, filePath), 'utf-8'));
  }
  return files;
}

export interface MonorepoGeneration {
  root: string;
  pluginDir: string;
  isNewMonorepo: boolean;
  files: FileMap;
}

export function getDefaultMonorepoName(orgName: string) {
  return `${kebabCase(orgName)}-plugins`;
}

/**
 * Works out every file to write when generating a plugin into a monorepo: a new monorepo when `monorepoRoot`
 * is not given, otherwise the existing one.
 */
export function planMonorepoGeneration({
  templateData,
  actions,
  monorepoRoot,
  newMonorepoPath,
}: {
  templateData: TemplateData;
  actions: PlacedTemplateAction[];
  monorepoRoot?: string;
  newMonorepoPath: string;
}): MonorepoGeneration {
  const isNewMonorepo = !monorepoRoot;
  const root = monorepoRoot ?? newMonorepoPath;
  const rootName = isNewMonorepo
    ? path.basename(root)
    : String(JSON.parse(readFileIfExists(path.join(root, 'package.json')) ?? '{}').name ?? path.basename(root));
  const pluginDir = `${PLUGINS_DIR}/${templateData.pluginId}`;

  if (isNewMonorepo && fs.existsSync(root) && fs.readdirSync(root).length > 0) {
    throw new Error(`Directory ${root} exists and contains files.`);
  }
  if (fs.existsSync(path.join(root, pluginDir))) {
    throw new Error(`Directory ${path.join(root, pluginDir)} already exists.`);
  }

  const { rootFiles, pluginFiles, provisioningFiles } = splitPluginFiles(renderActions(actions));
  const files: FileMap = new Map();

  const pluginPackageJson: PackageJson = JSON.parse(pluginFiles.get('package.json') ?? '{}');
  for (const [filePath, content] of pluginFiles) {
    const placed =
      filePath === 'package.json'
        ? `${JSON.stringify(createPluginPackageJson(pluginPackageJson, templateData), null, 2)}\n`
        : content;
    files.set(`${pluginDir}/${filePath}`, placed);
  }
  files.set(`${pluginDir}/AGENTS.md`, PLUGIN_AGENTS);
  files.set(`${pluginDir}/CLAUDE.md`, PLUGIN_AGENTS);

  if (isNewMonorepo) {
    for (const [filePath, content] of [...rootFiles, ...renderMonorepoTemplates(templateData)]) {
      files.set(filePath, content);
    }
    files.set(
      'package.json',
      `${JSON.stringify(createRootPackageJson(pluginPackageJson, templateData, rootName), null, 2)}\n`
    );
    if (templateData.packageManagerName === 'pnpm') {
      files.set('pnpm-workspace.yaml', stringifyYaml({ packages: ['.config', `${PLUGINS_DIR}/*`, 'packages/*'] }));
    }
  }

  const existingProvisioning = isNewMonorepo ? new Map() : readDirFiles(root, 'provisioning');
  for (const [filePath, content] of mergeProvisioning(existingProvisioning, provisioningFiles, templateData.pluginId)) {
    files.set(filePath, content);
  }

  const existingPlugins = isNewMonorepo ? [] : resolveProject(root).plugins.filter((plugin) => plugin.dir !== '.');
  const plugins = [...existingPlugins, { dir: pluginDir, id: templateData.pluginId }];
  const composeBase =
    files.get('.config/docker-compose-base.yaml') ??
    readFileIfExists(path.join(root, '.config/docker-compose-base.yaml')) ??
    '';
  files.set('docker-compose.yaml', createComposeFile(composeBase, plugins, rootName));

  const releasePlease = addToReleasePlease(
    {
      config: readFileIfExists(path.join(root, 'release-please-config.json')),
      manifest: readFileIfExists(path.join(root, '.release-please-manifest.json')),
    },
    pluginDir,
    templateData.pluginId,
    String(pluginPackageJson.version ?? '1.0.0')
  );
  files.set('release-please-config.json', releasePlease.config);
  files.set('.release-please-manifest.json', releasePlease.manifest);

  return { root, pluginDir, isNewMonorepo, files };
}

export async function writeFiles(root: string, files: FileMap) {
  for (const [filePath, content] of files) {
    const absolutePath = path.join(root, filePath);
    await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.promises.writeFile(absolutePath, content);
  }
}
