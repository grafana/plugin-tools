import type { Context } from '../../context.js';
import { addDependenciesToPackageJson, isVersionGreater, removeDependenciesFromPackageJson } from '../../utils.js';

const OLD_IMPORT = "import grafanaConfig from '@grafana/eslint-config/flat.js';";
const NEW_IMPORT = "import grafanaConfig from '@grafana/eslint-config';";
const ESLINT_CONFIG_PATH = '.config/eslint.config.mjs';

export default function migrate(context: Context) {
  if (!context.doesFileExist('package.json')) {
    return context;
  }

  const packageJson = JSON.parse(context.getFile('package.json') || '{}');
  const currentVersion = packageJson.devDependencies?.['@grafana/eslint-config'];

  if (!currentVersion || !isVersionGreater('^10.0.0', currentVersion)) {
    return context;
  }

  if (context.doesFileExist(ESLINT_CONFIG_PATH)) {
    const content = context.getFile(ESLINT_CONFIG_PATH) || '';
    if (content.includes(OLD_IMPORT)) {
      context.updateFile(ESLINT_CONFIG_PATH, content.replace(OLD_IMPORT, NEW_IMPORT));
    }
  }

  addDependenciesToPackageJson(
    context,
    {},
    {
      '@grafana/eslint-config': '^10.0.0',
      '@stylistic/eslint-plugin': '^5.10.0',
      'eslint-plugin-react-hooks': '^7.1.0',
    }
  );
  removeDependenciesFromPackageJson(context, [], ['@stylistic/eslint-plugin-ts']);

  return context;
}
