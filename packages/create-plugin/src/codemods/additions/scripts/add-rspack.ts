import { fileURLToPath } from 'node:url';
import type { Context } from '../../context.js';
import {
  additionsDebug,
  addDependenciesToPackageJson,
  readJsonFile,
  removeDependenciesFromPackageJson,
  renderTemplate,
} from '../../utils.js';
import { getConfig } from '../../../utils/utils.config.js';

const RSPACK_TEMPLATE_DATA_OVERRIDES = {
  useExperimentalRspack: true,
  frontendBundler: 'rspack',
};

const RSPACK_DEV_DEPENDENCIES = {
  '@rspack/core': '^1.6.0',
  '@rspack/cli': '^1.6.0',
  'ts-checker-rspack-plugin': '^1.2.0',
  'rspack-plugin-virtual-module': '^1.0.0',
  '@types/ws': '^8.18.1',
  ws: '^8.13.0',
};

const WEBPACK_ONLY_DEV_DEPENDENCIES = [
  'copy-webpack-plugin',
  'fork-ts-checker-webpack-plugin',
  'swc-loader',
  'webpack-livereload-plugin',
  'webpack-subresource-integrity',
  'webpack-virtual-modules',
  'webpack-cli',
];

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

export default function addRspack(context: Context): Context {
  if (context.doesFileExist('.config/rspack/rspack.config.ts')) {
    additionsDebug('Rspack config already exists. Skipping add-rspack addition.');
    return context;
  }

  if (!context.doesFileExist('.config/webpack/webpack.config.ts')) {
    additionsDebug('No webpack config found at .config/webpack/webpack.config.ts. Skipping.');
    return context;
  }

  addRspackConfigFiles(context);
  updateBundlerFiles(context);
  updateCprcConfig(context);

  const hasCustomConfig = handleCustomWebpackConfig(context);

  updatePackageJson(context, hasCustomConfig);
  deleteWebpackConfigFiles(context);

  return context;
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

function addRspackConfigFiles(context: Context): void {
  for (const filePath of RSPACK_CONFIG_FILES) {
    const rendered = renderTemplate(resolveTemplatePath(filePath), true, RSPACK_TEMPLATE_DATA_OVERRIDES);
    context.addFile(filePath, rendered);
  }
}

function updateBundlerFiles(context: Context): void {
  for (const filePath of BUNDLER_FILES) {
    const rendered = renderTemplate(resolveTemplatePath(filePath), true, RSPACK_TEMPLATE_DATA_OVERRIDES);
    context.doesFileExist(filePath) ? context.updateFile(filePath, rendered) : context.addFile(filePath, rendered);
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

  addDependenciesToPackageJson(context, {}, RSPACK_DEV_DEPENDENCIES);
  removeDependenciesFromPackageJson(context, [], WEBPACK_ONLY_DEV_DEPENDENCIES);

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

function deleteWebpackConfigFiles(context: Context): void {
  const webpackFiles = context.readDir('.config/webpack');

  for (const filePath of webpackFiles) {
    context.deleteFile(filePath);
  }
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
