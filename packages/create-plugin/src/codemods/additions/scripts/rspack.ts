import { fileURLToPath } from 'node:url';
import type { Context } from '../../context.js';
import {
  additionsDebug,
  addDependenciesToPackageJson,
  readJsonFile,
  removeDependenciesFromPackageJson,
  renderTemplate,
} from '../../utils.js';

const RSPACK_TEMPLATE_DATA_OVERRIDES = {
  useExperimentalRspack: true,
  frontendBundler: 'rspack',
};

const WEBPACK_TEMPLATE_DATA_OVERRIDES = {
  useExperimentalRspack: false,
  frontendBundler: 'webpack',
};

const RSPACK_CONFIG_FILES = [
  '.config/rspack/rspack.config.ts',
  '.config/rspack/BuildModeRspackPlugin.ts',
  '.config/rspack/liveReloadPlugin.ts',
];

const BUNDLER_FILES = [
  '.config/bundler/constants.ts',
  '.config/bundler/copyFiles.ts',
  '.config/bundler/externals.ts',
  '.config/bundler/utils.ts',
];

const WEBPACK_CONFIG_PATH = '.config/webpack/webpack.config.ts';
const RSPACK_CONFIG_PATH = '.config/rspack/rspack.config.ts';

// every file create-plugin has scaffolded into .config/webpack over time. anything else in there
// was added by the plugin author, so it is kept and reported instead of deleted
const WEBPACK_TEMPLATE_FILES = [
  '.config/webpack/BuildModeWebpackPlugin.ts',
  '.config/webpack/PluginSchemaWebpackPlugin.ts',
  '.config/webpack/constants.ts',
  '.config/webpack/generateCode.ts',
  '.config/webpack/publicPath.ts',
  '.config/webpack/tsconfig.webpack.json',
  '.config/webpack/utils.ts',
  '.config/webpack/watchPluginJson.ts',
  '.config/webpack/webpack.config.ts',
  '.config/webpack/webpack.parts.ts',
];

export default function rspack(context: Context): Context {
  const hasWebpackSetup = context.doesFileExist(WEBPACK_CONFIG_PATH);
  const hasRspackSetup = context.doesFileExist(RSPACK_CONFIG_PATH);

  if (!hasWebpackSetup && !hasRspackSetup) {
    context.setMessage({
      level: 'warning',
      title: 'No create-plugin bundler configuration found, so nothing was changed.',
      body: [`The rspack addition expects ${WEBPACK_CONFIG_PATH} or ${RSPACK_CONFIG_PATH} to exist.`],
    });
    return context;
  }

  const followUps: string[] = [];

  renderTemplateFiles(context, RSPACK_CONFIG_FILES);
  renderTemplateFiles(context, BUNDLER_FILES);
  updateCprcConfig(context);

  const hasCustomConfig = handleCustomWebpackConfig(context);

  updatePackageJson(context, hasCustomConfig);
  followUps.push(...deleteWebpackTemplateFiles(context));
  reportFollowUps(context, followUps);

  return context;
}

function reportFollowUps(context: Context, followUps: string[]): void {
  if (followUps.length === 0) {
    return;
  }

  context.setMessage({
    level: 'warning',
    title: 'The rspack addition left some things for you to review.',
    body: followUps,
  });
}

function updateCprcConfig(context: Context): void {
  const cprcPath = '.config/.cprc.json';
  if (context.doesFileExist(cprcPath)) {
    const config = readJsonFile(context, cprcPath);

    const updated = {
      ...config,
      features: {
        ...config.features,
        useExperimentalRspack: true,
      },
    };

    context.updateFile(cprcPath, JSON.stringify(updated, null, 2));
  }
}

const resolveTemplatePath = (relativePath: string) =>
  fileURLToPath(new URL(`../../../../templates/common/${relativePath}`, import.meta.url));

// updateFile is a no-op for identical content, so re-rendering on every run keeps the addition idempotent
function renderTemplateFiles(context: Context, filePaths: string[]): void {
  for (const filePath of filePaths) {
    const rendered = renderTemplate(resolveTemplatePath(filePath), true, RSPACK_TEMPLATE_DATA_OVERRIDES);
    if (context.doesFileExist(filePath)) {
      context.updateFile(filePath, rendered);
    } else {
      context.addFile(filePath, rendered);
    }
  }
}

function handleCustomWebpackConfig(context: Context): boolean {
  const hasCustomConfig = context.doesFileExist('webpack.config.ts');

  if (!hasCustomConfig) {
    return false;
  }

  additionsDebug('Custom root webpack.config.ts detected. Creating rspack.config.ts stub with migration instructions.');

  context.addFile('rspack.config.ts', ROOT_RSPACK_CONFIG_TEMPLATE);

  return true;
}

interface PackageJson {
  scripts: Record<string, string>;
  [key: string]: unknown;
}

function updatePackageJson(context: Context, hasCustomConfig: boolean): void {
  if (!context.doesFileExist('package.json')) {
    additionsDebug('No package.json found. Skipping dependency and script updates.');
    return;
  }

  const { rspackOnlyDevDependencies, webpackOnlyDevDependencies } = getBundlerDevDependencies();
  addDependenciesToPackageJson(context, {}, rspackOnlyDevDependencies);
  removeDependenciesFromPackageJson(context, [], webpackOnlyDevDependencies);

  const packageJson = readJsonFile<PackageJson>(context, 'package.json');
  const configPath = hasCustomConfig ? './rspack.config.ts' : './.config/rspack/rspack.config.ts';
  const updatedScripts = {
    ...packageJson.scripts,
    build: `rspack -c ${configPath} --env production`,
    dev: `rspack -w -c ${configPath} --env development`,
  };
  const updatedPackageJson = {
    ...packageJson,
    scripts: updatedScripts,
  };

  context.updateFile('package.json', JSON.stringify(updatedPackageJson, null, 2));
}

// The rspack and webpack renders of the package.json template are the source of truth for which
// dev dependencies each bundler needs, so the addition never drifts from what `generate` scaffolds
function getBundlerDevDependencies() {
  const templatePath = resolveTemplatePath('_package.json');
  const rspackDevDependencies = renderDevDependencies(templatePath, RSPACK_TEMPLATE_DATA_OVERRIDES);
  const webpackDevDependencies = renderDevDependencies(templatePath, WEBPACK_TEMPLATE_DATA_OVERRIDES);

  const rspackOnlyDevDependencies = Object.fromEntries(
    Object.entries(rspackDevDependencies).filter(([name]) => !(name in webpackDevDependencies))
  );
  const webpackOnlyDevDependencies = Object.keys(webpackDevDependencies).filter(
    (name) => !(name in rspackDevDependencies)
  );

  return { rspackOnlyDevDependencies, webpackOnlyDevDependencies };
}

function renderDevDependencies(templatePath: string, templateData: Record<string, unknown>): Record<string, string> {
  const rendered: { devDependencies?: Record<string, string> } = JSON.parse(
    renderTemplate(templatePath, false, templateData)
  );
  return rendered.devDependencies ?? {};
}

function deleteWebpackTemplateFiles(context: Context): string[] {
  for (const filePath of WEBPACK_TEMPLATE_FILES) {
    if (context.doesFileExist(filePath)) {
      context.deleteFile(filePath);
    }
  }

  const leftoverFiles = context.readDir('.config/webpack');
  if (leftoverFiles.length === 0) {
    return [];
  }

  return [
    'These files in .config/webpack were not created by create-plugin, so they were kept. Move anything you still need out of .config and port it to rspack:',
    ...leftoverFiles.map((filePath) => `  ${filePath}`),
  ];
}

const ROOT_RSPACK_CONFIG_TEMPLATE = `import type { Configuration } from '@rspack/core';
import grafanaConfig from './.config/rspack/rspack.config';

// TODO: Your plugin extends the default bundler configuration.
// The custom webpack overrides in ./webpack.config.ts need to be
// migrated to this rspack configuration file.
//
// 1. Review your customizations in ./webpack.config.ts
// 2. Apply equivalent rspack configuration below using webpack-merge
// 3. Remove the error below once migration is complete
// 4. Delete ./webpack.config.ts
//
// See: https://grafana.com/developers/plugin-tools/how-to-guides/extend-configurations

throw new Error(
  '[add-rspack] This plugin has a custom webpack configuration that needs ' +
    'manual migration to rspack. See the comments in this file for instructions.'
);

const config = async (env: Record<string, unknown>): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);
  return baseConfig;
};

export default config;
`;
