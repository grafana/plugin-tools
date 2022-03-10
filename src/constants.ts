import path from 'path';

export const IS_DEV = process.env.CREATE_PLUGIN_DEV !== undefined;

export const DEV_EXPORT_DIR = path.join(__dirname, '..', 'generated');

export const EXPORT_PATH_PREFIX = IS_DEV ? DEV_EXPORT_DIR : process.cwd();

export const DIST_DIR = path.join(__dirname, 'dist');

export const PLOP_FILE = path.join(__dirname, 'plopfile.js');

export const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// Partials are template files that can be used in other templates
// (they won't be copied over to the generated folder as they are)
export const PARTIALS_DIR = path.join(TEMPLATES_DIR, '_partials');

export const TEMPLATE_PATHS = {
  app: path.join(TEMPLATES_DIR, 'app'),
  backend: path.join(TEMPLATES_DIR, 'backend'),
  common: path.join(TEMPLATES_DIR, 'common'),
  datasource: path.join(TEMPLATES_DIR, 'datasource'),
  panel: path.join(TEMPLATES_DIR, 'panel'),
  workflows: path.join(TEMPLATES_DIR, 'github'),
};

export enum PLUGIN_TYPES {
  app = 'app',
  panel = 'panel',
  datasource = 'datasource',
}
