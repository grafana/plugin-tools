import { Context } from '../context.js';
import minimist from 'minimist';

const knownImportsMap: Record<string, { name: string; path: string }> = {
  './.config/.eslintrc': {
    name: 'defaultConfig',
    path: './.config/eslint.config.mjs',
  },
  '@grafana/eslint-config': {
    name: 'grafanaConfig',
    path: '@grafana/eslint-config/flat.js',
  },
};

const typeDocBlock = `/**
 * @type {Array<import('eslint').Linter.Config>}
 */`;

export default async function migrate(context: Context) {
  const rootEslintConfig = context.doesFileExist('.eslintrc');
  if (rootEslintConfig) {
    const ignorePaths = getIgnorePaths(context);
    convertLegacyConfig(context, '.eslintrc', ignorePaths);
  }

  return context;
}

function convertLegacyConfig(context: Context, legacyConfigPath: string, ignorePaths?: string[]) {
  const legacyEslintConfigRaw = context.getFile(legacyConfigPath) ?? '';
  const legacyEslintConfig = JSON.parse(legacyEslintConfigRaw);
  const flatConfig: Array<Record<string, any>> = [];
  const imports: Array<{ name: string; path: string }> = [];

  if (legacyEslintConfig.extends && knownImportsMap[legacyEslintConfig.extends]) {
    imports.push(knownImportsMap[legacyEslintConfig.extends]);
  }

  if (legacyEslintConfig.plugins) {
    legacyEslintConfig.plugins.forEach((plugin: string) => {
      const pluginImport = getPluginImport(plugin);
      const importName = pluginImport.replace('eslint-plugin-', '').replace('-', '');
      imports.push({ name: importName, path: pluginImport });
    });
  }

  if (legacyEslintConfig.rules) {
    Object.entries(legacyEslintConfig.rules).forEach(([rule, value]) => {
      flatConfig.push({ [rule]: value });
    });
  }

  if (ignorePaths && ignorePaths.length > 0) {
    flatConfig.push({ ignores: ignorePaths });
  }

  const importsString = imports.map(({ name, path }) => `import ${name} from '${path}';`).join('\n');
  const fileToWrite = context.normalisePath(legacyConfigPath).replace('.eslintrc', 'eslint.config.mjs');

  const content =
    imports.length === 1
      ? `${importsString}

${typeDocBlock}
export default ${imports[0].name};
`
      : `${importsString}

${typeDocBlock}
const config = [${flatConfig.map((config) => JSON.stringify(config)).join(', ')}];

export default config;
`;

  context.addFile(fileToWrite, content);
  context.deleteFile(legacyConfigPath);
}

export function getIgnorePaths(context: Context): string[] {
  const result: string[] = [];

  if (context.doesFileExist('.eslintignore')) {
    const eslintIgnore = context.getFile('.eslintignore');
    if (eslintIgnore) {
      result.push(
        ...eslintIgnore
          .split('\n')
          .filter((line) => line.length > 0 && !line.startsWith('#'))
          .map((line) => line.trim())
      );
    }
  }

  const packageJsonRaw = context.getFile('package.json');
  if (packageJsonRaw) {
    const packageJson = JSON.parse(packageJsonRaw);
    for (const [_, script] of Object.entries<string>(packageJson.scripts)) {
      if (script.includes('eslint')) {
        // find any references to --ignore-path in a script like `eslint --cache --ignore-path ./.gitignore --ext .js,.jsx,.ts,.tsx .`
        // and extract the path to the ignore file...
        const args = script.split(' ').slice(1);
        const parsedArgs = minimist(args);
        const ignorePath = parsedArgs['ignore-path'];

        if (ignorePath && context.doesFileExist(ignorePath)) {
          const ignorePathContent = context.getFile(ignorePath);
          if (ignorePathContent) {
            result.push(
              ...ignorePathContent
                .split('\n')
                .filter((line) => line.length > 0 && !line.startsWith('#'))
                .map((line) => line.trim())
            );
          }
        }
      }
    }
  }

  return result;
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
