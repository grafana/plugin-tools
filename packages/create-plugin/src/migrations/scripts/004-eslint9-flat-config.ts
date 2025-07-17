import { dirname, relative, resolve } from 'node:path';
import type { Context } from '../context.js';
import { parse } from 'jsonc-parser';
import * as recast from 'recast';
import type { Linter } from 'eslint';
import { camelCase } from 'change-case';
import { inspect } from 'node:util';

const builders = recast.types.builders;

type Imports = Map<string, { name?: string; bindings: string[] }>;

const legacyKeysToCopy: Array<keyof Linter.ConfigOverride> = ['rules', 'settings'];

export default function migrate(context: Context): Context {
  const discoveredConfigs = discoverRelativeLegacyConfigs(context, '.eslintrc');

  for (const [legacyFilePath, legacyConfig] of discoveredConfigs.entries()) {
    // Write the flat config file.
    const flatConfigFilePath = context.normalisePath(legacyFilePath).replace('.eslintrc', 'eslint.config.mjs');
    const result = migrateLegacyConfig(legacyConfig);
    context.addFile(flatConfigFilePath, result);
    // Delete the legacy config file.
    context.deleteFile(legacyFilePath);
  }

  return context;
}

export function migrateLegacyConfig(config: Linter.LegacyConfig) {
  const imports: Imports = new Map();

  const flatConfigFileContents = [];

  imports.set('eslint/config', { bindings: ['defineConfig'] });
  const configs = addConfigsToMigration(imports, config as Linter.ConfigOverride);

  if (config.overrides) {
    config.overrides.forEach((override) => {
      configs.push(...addConfigsToMigration(imports, override));
    });
  }

  // Once all configs are processed all required imports are available.
  const allImports = generateImports(imports);
  flatConfigFileContents.push(...allImports);

  // Wrap the config in defineConfig
  const defineConfigNode = builders.callExpression(builders.identifier('defineConfig'), [
    builders.arrayExpression(configs),
  ]);
  // default export the defineConfig
  flatConfigFileContents.push(builders.exportDefaultDeclaration(defineConfigNode));

  return recast.print(builders.program(flatConfigFileContents), {
    tabWidth: 2,
    trailingComma: true,
    lineTerminator: '\n',
  }).code;
}

function addConfigsToMigration(imports: Imports, config: Linter.ConfigOverride) {
  const configSections: recast.types.namedTypes.Property[] = [];
  const extendedSections: recast.types.namedTypes.SpreadElement[] = [];

  if (config.files) {
    const files = Array.isArray(config.files) ? config.files : [config.files];
    const filesArrayAST = builders.arrayExpression(files.map((file) => builders.literal(file)));
    configSections.push(builders.property('init', builders.identifier('files'), filesArrayAST));
  }

  if (config.excludedFiles) {
    const excludedFiles = Array.isArray(config.excludedFiles) ? config.excludedFiles : [config.excludedFiles];
    const excludedFilesArrayAST = builders.arrayExpression(excludedFiles.map((file) => builders.literal(file)));
    configSections.push(builders.property('init', builders.identifier('ignores'), excludedFilesArrayAST));
  }

  if (config.extends) {
    const extended = generateExtends(config.extends, imports);
    extendedSections.push(...extended);
  }

  if (config.parserOptions) {
    const languageOptions = generateLanguageOptions(config);
    if (languageOptions) {
      configSections.push(builders.property('init', builders.identifier('languageOptions'), languageOptions));
    }
  }

  if (config.plugins) {
    const plugins = generatePlugins(config.plugins, imports);
    configSections.push(builders.property('init', builders.identifier('plugins'), plugins));
  }

  legacyKeysToCopy.forEach((key) => {
    if (config[key]) {
      const value = typeof config[key] === 'object' ? generatePropValue(config[key]) : builders.literal(config[key]);
      configSections.push(builders.property('init', builders.identifier(key), value));
    }
  });

  if (configSections.length > 0) {
    return [...extendedSections, builders.objectExpression(configSections)];
  }

  return extendedSections;
}

function generatePropValue(
  value: Object
):
  | recast.types.namedTypes.ObjectExpression
  | recast.types.namedTypes.ArrayExpression
  | recast.types.namedTypes.Literal {
  if (Array.isArray(value)) {
    return builders.arrayExpression(value.map((i) => generatePropValue(i)));
  }
  if (value && typeof value === 'object') {
    const props = Object.keys(value).map((key) => {
      const propValue = value[key as keyof typeof value];
      const identifier = builders.literal(key);
      return builders.property('init', identifier, generatePropValue(propValue));
    });
    return builders.objectExpression(props);
  }
  return builders.literal(value);
}

function generateExtends(extendsConfig: string | string[], imports: Imports): recast.types.namedTypes.SpreadElement[] {
  const extendsArray = Array.isArray(extendsConfig) ? extendsConfig : [extendsConfig];
  const extendsNodes: recast.types.namedTypes.SpreadElement[] = [];

  extendsArray.forEach((extend, idx) => {
    if (extend.endsWith('.eslintrc')) {
      const importName = idx ? `baseConfig${idx}` : 'baseConfig';
      const rewrittenPath = extend.replace('.eslintrc', 'eslint.config.mjs');

      extendsNodes.push(builders.spreadElement(builders.identifier(importName)));

      imports.set(rewrittenPath, { name: importName, bindings: [rewrittenPath] });
    } else {
      if (extend === '@grafana/eslint-config') {
        const importName = 'grafanaConfig';
        extendsNodes.push(builders.spreadElement(builders.identifier(importName)));

        imports.set('@grafana/eslint-config/flat.js', {
          name: importName,
          bindings: ['@grafana/eslint-config'],
        });
      }
    }
  });

  return extendsNodes;
}

function generateLanguageOptions(config: Linter.ConfigOverride) {
  const props: recast.types.namedTypes.Property[] = [];

  if (config.parserOptions) {
    const { ecmaVersion, sourceType, ...rest } = config.parserOptions;

    if (ecmaVersion) {
      props.push(builders.property('init', builders.literal('ecmaVersion'), builders.literal(ecmaVersion)));
    }

    if (sourceType) {
      props.push(builders.property('init', builders.literal('sourceType'), builders.literal(sourceType)));
    }

    if (Object.keys(rest).length > 0) {
      props.push(builders.property('init', builders.identifier('parserOptions'), generatePropValue(rest)));
    }
  }

  return props.length > 0 ? builders.objectExpression(props) : undefined;
}

function generateImports(imports: Imports) {
  const importNodes: recast.types.namedTypes.ImportDeclaration[] = [];
  imports.forEach(({ name, bindings }, path) => {
    importNodes.push(
      name
        ? builders.importDeclaration(
            [builders.importDefaultSpecifier(builders.identifier(name))],
            builders.literal(path)
          )
        : builders.importDeclaration(
            bindings.map((binding) => builders.importSpecifier(builders.identifier(binding))),
            builders.literal(path)
          )
    );
  });
  return importNodes;
}

function generatePlugins(plugins: string[], imports: Imports) {
  const props: recast.types.namedTypes.Property[] = [];

  plugins.forEach((plugin) => {
    const varName = getPluginVarName(plugin);
    const importName = getPluginImport(plugin);
    const shortPluginName = getPluginShortName(plugin);
    props.push(builders.property('init', builders.literal(shortPluginName), builders.identifier(varName)));
    imports.set(importName, { name: varName, bindings: [importName] });
  });

  return builders.objectExpression(props);
}

function getPluginVarName(pluginName: string) {
  let name = pluginName.replace(/^eslint-plugin-/, '');

  if (name === 'import' || name === 'export') {
    return `${name}Plugin`;
  }

  if (name.startsWith('@')) {
    name = name.substring(1);
  }

  return camelCase(name);
}

function getPluginShortName(pluginName: string) {
  if (pluginName.startsWith('@')) {
    let match = pluginName.match(/^@([^/]+)\/eslint-plugin$/);

    if (match) {
      return match[1];
    }
    match = pluginName.match(/^@([^/]+)\/eslint-plugin-(.+)$/);

    if (match) {
      return `${match[1]}/${match[2]}`;
    }
  }
  if (pluginName.startsWith('eslint-plugin-')) {
    return pluginName.replace('eslint-plugin-', '');
  }
  return pluginName;
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
  if (name.includes('eslint-plugin')) {
    return `${scope}/${name}`;
  }
  return `${scope}/eslint-plugin-${name}`;
}

export function discoverRelativeLegacyConfigs(
  context: Context,
  configPath: string,
  discoveredConfigs: Map<string, Linter.ConfigOverride> = new Map()
): Map<string, Linter.ConfigOverride> {
  if (discoveredConfigs.has(configPath)) {
    return discoveredConfigs;
  }

  if (!context.doesFileExist(configPath)) {
    return discoveredConfigs;
  }
  const config = parseJsonConfig(context, configPath);

  discoveredConfigs.set(configPath, config);

  if (config.extends) {
    const relativeExtends = getRelativeExtends(config.extends, configPath);
    return relativeExtends.reduce(
      (acc, relativeExtend) => discoverRelativeLegacyConfigs(context, relativeExtend, acc),
      discoveredConfigs
    );
  }

  return discoveredConfigs;
}

// Legacy eslint configs are JSONC files, so we use jsonc-parser to parse them.
function parseJsonConfig(context: Context, legacyConfigPath: string) {
  const legacyEslintConfigRaw = context.getFile(legacyConfigPath) ?? '';
  return parse(legacyEslintConfigRaw);
}

function getRelativeExtends(extendsConfig: string | string[], currentFilePath: string): string[] {
  const extendsArray = Array.isArray(extendsConfig) ? extendsConfig : [extendsConfig];
  const localExtends = extendsArray.filter(isNotBareSpecifier);
  return localExtends.map((extend) => {
    const resolvedPath = resolve(dirname(currentFilePath), extend);
    return relative('.', resolvedPath);
  });
}

function isNotBareSpecifier(packageName: string) {
  const isRelative = packageName.startsWith('./') || packageName.startsWith('../') || packageName.startsWith('/');
  const isLocalFile = packageName.startsWith('.') && !packageName.startsWith('@');

  return isRelative || isLocalFile;
}
