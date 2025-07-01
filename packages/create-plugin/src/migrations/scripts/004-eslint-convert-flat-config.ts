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
  const processedConfigs = new Set<string>();
  const ignorePaths = getIgnorePaths(context);

  // Start with root config and discover all related configs
  const configFiles = discoverConfigFiles(context, '.eslintrc');

  // Convert each config file
  for (const configFile of configFiles) {
    if (!processedConfigs.has(configFile)) {
      const conversionResult = convertLegacyConfig(context, configFile, processedConfigs, ignorePaths);
      if (conversionResult) {
        const content = generateFlatConfigContent(conversionResult.imports, conversionResult.flatConfig);
        const fileToWrite = context.normalisePath(configFile).replace('.eslintrc', 'eslint.config.mjs');
        context.addFile(fileToWrite, content);
        context.deleteFile(configFile);
      }
    }
  }

  return context;
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
        const fullPath = resolveRelativePath(configPath, relativeExtend);
        discoverConfig(fullPath);
      }
    }
  }

  discoverConfig(rootConfigPath);
  return Array.from(discoveredConfigs);
}

function convertLegacyConfig(
  context: Context,
  legacyConfigPath: string,
  processedConfigs: Set<string>,
  ignorePaths?: string[]
): { imports: Array<{ name: string; path: string }>; flatConfig: Array<Record<string, any>> } | null {
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

function parseJsonConfig(context: Context, legacyConfigPath: string) {
  const legacyEslintConfigRaw = context.getFile(legacyConfigPath) ?? '';
  return JSON.parse(legacyEslintConfigRaw);
}

function extractImports(legacyEslintConfig: any): Array<{ name: string; path: string }> {
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

  return imports;
}

function buildFlatConfig(legacyEslintConfig: any, ignorePaths?: string[]): Array<Record<string, any>> {
  const flatConfig: Array<Record<string, any>> = [];

  if (legacyEslintConfig.rules) {
    Object.entries(legacyEslintConfig.rules).forEach(([rule, value]) => {
      flatConfig.push({ [rule]: value });
    });
  }

  if (ignorePaths && ignorePaths.length > 0) {
    flatConfig.push({ ignores: ignorePaths });
  }

  return flatConfig;
}

function generateFlatConfigContent(
  imports: Array<{ name: string; path: string }>,
  flatConfig: Array<Record<string, any>>
): string {
  const importsString = imports.map(({ name, path }) => `import ${name} from '${path}';`).join('\n');

  return imports.length === 1
    ? `${importsString}

${typeDocBlock}
export default ${imports[0].name};
`
    : `${importsString}

${typeDocBlock}
const config = [${flatConfig.map((config) => JSON.stringify(config)).join(', ')}];

export default config;
`;
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

function getRelativeExtends(extendsConfig: string | string[]): string[] {
  const extendsArray = Array.isArray(extendsConfig) ? extendsConfig : [extendsConfig];
  return extendsArray.filter(
    (extend) =>
      extend.startsWith('./') || extend.startsWith('../') || (extend.startsWith('.') && !extend.startsWith('@'))
  );
}

function resolveRelativePath(fromPath: string, relativePath: string): string {
  // Simple path resolution - assumes we're working with relative paths
  // For now, just append the relative path to the directory of fromPath
  const fromDir = fromPath.substring(0, fromPath.lastIndexOf('/') + 1);
  return fromDir + relativePath;
}
