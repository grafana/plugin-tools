import { Context } from '../context.js';

export default async function migrate(context: Context) {
  const rootEslintConfig = context.doesFileExist('.eslintrc');
  if (rootEslintConfig) {
    const rootEslintConfigRaw = context.getFile('.eslintrc') || '';

    const eslintConfig = JSON.parse(rootEslintConfigRaw);
    const imports: Array<{ name: string; path: string }> = [];

    if (eslintConfig.extends && eslintConfig.extends === './.config/.eslintrc') {
      imports.push({ name: 'defaultConfig', path: './.config/eslint.config.js' });
    }

    const importsString = imports.map(({ name, path }) => `const ${name} = require('${path}');`).join('\n');

    context.addFile(
      'eslint.config.js',
      `${importsString}

/**
 * @type {Array<import('eslint').Linter.Config>}
 */
module.exports = defaultConfig;
`
    );
    context.deleteFile('.eslintrc');
  }

  return context;
}

function getPluginImport(pluginName: string): string {
  if (pluginName.includes('eslint-plugin-')) {
    return pluginName;
  }
  if (!pluginName.startsWith('@')) {
    return `eslint-plugin-${pluginName}`;
  }
  if (!pluginName.includes('/')) {
    return `${pluginName}/eslint-plugin`;
  }
  const [scope, name] = pluginName.split('/');
  return `${scope}/eslint-plugin-${name}`;
}
