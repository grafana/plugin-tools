import minimist from 'minimist';
import { inspect } from 'node:util';
import { camelCase } from 'change-case';
import { Context } from '../context.js';
import { output } from '../../utils/utils.console.js';
import type { Linter } from 'eslint';

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
  const processedConfigs = new Set<string>();
  const ignorePaths = getIgnorePaths(context);

  // Start with root config and discover all related configs
  const configFiles = discoverConfigFiles(context, '.eslintrc');

  // Convert each config file
  for (const configFile of configFiles) {
    if (!processedConfigs.has(configFile)) {
      const conversionResult = convertLegacyConfig(
        context,
        configFile,
        processedConfigs,
        // only root config should have ignores as these are project specific.
        configFile === '.eslintrc' ? ignorePaths : []
      );
      if (conversionResult) {
        let content = generateFlatConfigContent(conversionResult.imports, conversionResult.flatConfig);
        const fileToWrite = context.normalisePath(configFile).replace('.eslintrc', 'eslint.config.mjs');
        // remove quotes from any references to imports in the content
        for (const importName of conversionResult.imports) {
          content = content.replace(new RegExp(`'${importName.name}'`, 'g'), importName.name);
        }
        context.addFile(fileToWrite, content);

        // Delete the original config file
        context.deleteFile(configFile);
      }
    }
  }

  return context;
}

function convertLegacyConfig(
  context: Context,
  legacyConfigPath: string,
  processedConfigs: Set<string>,
  ignorePaths?: string[]
): { imports: Array<{ name: string; path: string }>; flatConfig: Linter.Config[] } | null {
  // Prevent infinite loops
  if (processedConfigs.has(legacyConfigPath)) {
    return null;
  }
  processedConfigs.add(legacyConfigPath);

  const legacyEslintConfig = parseJsonConfig(context, legacyConfigPath);
  const imports = extractImports(legacyEslintConfig);
  const flatConfig = buildFlatConfig(legacyEslintConfig, ignorePaths);

  return { imports, flatConfig };
}

export function extractImports(legacyEslintConfig: Linter.LegacyConfig): Array<{ name: string; path: string }> {
  const imports: Array<{ name: string; path: string }> = [];

  if (legacyEslintConfig.extends && knownImportsMap[legacyEslintConfig.extends as keyof typeof knownImportsMap]) {
    imports.push(knownImportsMap[legacyEslintConfig.extends as keyof typeof knownImportsMap]);
  }

  if (legacyEslintConfig.plugins) {
    legacyEslintConfig.plugins.forEach((plugin: string) => {
      const pluginImport = getPluginImport(plugin);
      const importName = camelCase(pluginImport.replace('eslint-plugin-', ''));
      imports.push({ name: importName, path: pluginImport });
    });
  }

  return imports;
}

function buildFlatConfig(legacyEslintConfig: Linter.LegacyConfig, ignorePaths?: string[]): Linter.Config[] {
  const flatConfig: Linter.Config[] = [];

  if (ignorePaths && ignorePaths.length > 0) {
    flatConfig.push({ ignores: ignorePaths });
  }

  if (legacyEslintConfig.rules) {
    const config: Linter.Config = { rules: legacyEslintConfig.rules };

    // Add plugins if they exist
    if (legacyEslintConfig.plugins) {
      const plugins: Record<string, any> = {};
      legacyEslintConfig.plugins.forEach((plugin: string) => {
        const pluginKey = plugin.replace('eslint-plugin-', '');
        const importName = camelCase(plugin.replace('eslint-plugin-', ''));
        plugins[pluginKey] = importName;
      });
      config.plugins = plugins;
    }

    flatConfig.push(config);
  }

  if (legacyEslintConfig.overrides) {
    legacyEslintConfig.overrides.forEach((override) => {
      const overrideConfig: Linter.Config = {
        files: Array.isArray(override.files) ? override.files : [override.files],
        rules: override.rules,
      };

      if (override.parserOptions) {
        overrideConfig.languageOptions = {
          parserOptions: override.parserOptions,
        };
      }

      flatConfig.push(overrideConfig);
    });
  }

  return flatConfig;
}

function generateFlatConfigContent(
  imports: Array<{ name: string; path: string }>,
  flatConfig: Linter.Config[]
): string {
  const importsString = imports.map(({ name, path }) => `import ${name} from '${path}';`).join('\n');

  if (flatConfig.length === 0) {
    return `${importsString}

${typeDocBlock}
export default ${imports[0].name};
`;
  }

  const configItems = flatConfig.map((config) => inspect(config, { depth: null, colors: false })).join(',\n');

  return `${importsString}

${typeDocBlock}
const config = [\n...${imports[0].name},\n${configItems}\n];

export default config;
`;
}

export function getIgnorePaths(context: Context): string[] {
  const result = new Set<string>();

  if (context.doesFileExist('.eslintignore')) {
    const eslintIgnore = context.getFile('.eslintignore');
    if (eslintIgnore) {
      const linesToAdd = addIgnoreLinesToSet(eslintIgnore);
      linesToAdd.forEach((line) => result.add(line));
    }
  }

  const packageJsonRaw = context.getFile('package.json');
  if (packageJsonRaw) {
    try {
      const packageJson = JSON.parse(packageJsonRaw);
      if (packageJson.scripts) {
        for (const [_, script] of Object.entries<string>(packageJson.scripts)) {
          if (script.includes('eslint')) {
            const args = script.split(' ').slice(1);
            const parsedArgs = minimist(args);
            const ignorePath = parsedArgs['ignore-path'];

            if (ignorePath && context.doesFileExist(ignorePath)) {
              const ignorePathContent = context.getFile(ignorePath);
              if (ignorePathContent) {
                const linesToAdd = addIgnoreLinesToSet(ignorePathContent);
                linesToAdd.forEach((line) => result.add(line));
              }
            }
          }
        }
      }
    } catch (error) {
      output.warning({
        title: 'Error parsing package.json',
        body: [`${error}`],
      });
    }
  }

  return Array.from(result);
}

const addIgnoreLinesToSet = (content: string) =>
  content
    .split('\n')
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => line.trim());

export function getPluginImport(pluginName: string): string {
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
  if (name.includes('eslint-plugin')) {
    return `${scope}/${name}`;
  }
  return `${scope}/eslint-plugin-${name}`;
}

function getRelativeExtends(extendsConfig: string | string[]): string[] {
  const extendsArray = Array.isArray(extendsConfig) ? extendsConfig : [extendsConfig];
  return extendsArray.filter(
    (extend) =>
      extend.startsWith('./') || extend.startsWith('../') || (extend.startsWith('.') && !extend.startsWith('@'))
  );
}

function discoverConfigFiles(context: Context, rootConfigPath: string): string[] {
  const discoveredConfigs = new Set<string>();

  function discoverConfig(configPath: string) {
    if (discoveredConfigs.has(configPath)) {
      return;
    }

    if (!context.doesFileExist(configPath)) {
      return;
    }

    discoveredConfigs.add(configPath);

    const config = parseJsonConfig(context, configPath);

    if (config.extends) {
      const relativeExtends = getRelativeExtends(config.extends);
      for (const relativeExtend of relativeExtends) {
        discoverConfig(relativeExtend);
      }
    }
  }

  discoverConfig(rootConfigPath);
  return Array.from(discoveredConfigs);
}

function parseJsonConfig(context: Context, legacyConfigPath: string) {
  const legacyEslintConfigRaw = context.getFile(legacyConfigPath) ?? '';
  return JSON.parse(legacyEslintConfigRaw);
}
