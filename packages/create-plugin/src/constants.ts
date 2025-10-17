import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export const IS_DEV = process.env.CREATE_PLUGIN_DEV !== undefined;

export const EXPORT_PATH_PREFIX = process.cwd();

export const DIST_DIR = path.join(__dirname, 'dist');

export const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// Partials are template files that can be used in other templates
// (they won't be copied over to the generated folder as they are)
export const PARTIALS_DIR = path.join(TEMPLATES_DIR, '_partials');

export const FIXTURES_PATH = path.join(__dirname, '..', 'fixtures');

export const TEMPLATE_PATHS: Record<string, string> = {
  app: path.join(TEMPLATES_DIR, 'app'),
  scenesapp: path.join(TEMPLATES_DIR, 'scenes-app'),
  backend: path.join(TEMPLATES_DIR, 'backend'),
  backendApp: path.join(TEMPLATES_DIR, 'backend-app'),
  common: path.join(TEMPLATES_DIR, 'common'),
  datasource: path.join(TEMPLATES_DIR, 'datasource'),
  panel: path.join(TEMPLATES_DIR, 'panel'),
  ciWorkflows: path.join(TEMPLATES_DIR, 'github'),
};

export enum PLUGIN_TYPES {
  app = 'app',
  panel = 'panel',
  datasource = 'datasource',
  // TODO: Don't understand why this is here. Cannot create a secretsmanager or a renderer.
  // secretsmanager = 'secretsmanager',
  scenes = 'scenesapp',
}

// Version cutoff for migration system transition.
// Plugins with create-plugin version < 5.27.1 used the legacy update command.
// Plugins >= 5.27.1 use the new migration-based update system.
export const LEGACY_UPDATE_CUTOFF_VERSION = '5.27.1';

// This gets merged into variables coming from user prompts (when scaffolding) or any other dynamic variables,
// and will be available to use in the templates.
export const EXTRA_TEMPLATE_VARIABLES = {
  grafanaImage: 'grafana-enterprise',
};

export const DEFAULT_FEATURE_FLAGS = {
  useReactRouterV6: true,
  bundleGrafanaUI: false,
  useExperimentalRspack: false,
  useExperimentalUpdates: true,
};

export const GRAFANA_FE_PACKAGES = ['@grafana/data', '@grafana/runtime', '@grafana/schema', '@grafana/ui'];

export const MIGRATION_CONFIG = {
  // Files that should be overriden during a migration.
  // (paths are relative to the scaffolded projects root)
  filesToOverride: [
    '.config/',
    '.eslintrc',
    '.nvmrc',
    '.prettierrc.js',
    'docker-compose.yaml', // Using .yaml instead of .yml (https://yaml.org/faq.html)
    'jest-setup.js',
    'jest.config.js',
    'tsconfig.json',
  ],
  // Files that are mandatory for the plugins, but we don't want to ever override them. We are only creating the ones that don't exist.
  // (paths are relative to the scaffolded projects root)
  filesToExist: ['CHANGELOG.md'],
  // Files that are no longer needed for the project and possibly can be removed.
  filesToRemove: ['Dockerfile', 'docker-compose.yml', 'webpack/', '.webpack/', '.prettierrc'],
  // NPM dependencies that are no longer needed for the project and possibly can be removed.
  npmDependenciesToRemove: ['ts-loader', 'babel-loader', '@grafana/toolkit'],
  devNpmDependenciesToRemove: ['@grafana/toolkit', '@grafana/runtime', '@grafana/data', '@grafana/ui'],
};

export const UDPATE_CONFIG = {
  // Files that should be overriden between configuration version updates.
  filesToOverride: ['.config/', '.cprc.json'],
  // Files that are no longer needed for the project and can be removed.
  filesToRemove: ['.config/webpack/publicPath.ts'],
};
