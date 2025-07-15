import { dirname, relative, resolve } from 'node:path';
import type { Context } from '../context.js';
import { parse } from 'jsonc-parser';
import * as recast from 'recast';
import type { Linter } from 'eslint';
import { camelCase } from 'change-case';

const builders = recast.types.builders;

interface Migration {
  imports: Map<string, { name?: string; modules: string[] }>;
}

const legacyKeysToCopy: Array<keyof Linter.ConfigOverride> = ['rules'];

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
  const migration: Migration = {
    imports: new Map(),
  };

  const flatConfigFileContents = [];

  migration.imports.set('eslint/config', { modules: ['defineConfig'] });
  const configs = addConfigsToMigration(migration, config as Linter.ConfigOverride);

  if (config.overrides) {
    config.overrides.forEach((override) => {
      configs.push(...addConfigsToMigration(migration, override));
    });
  }

  const imports = generateImports(migration);
  flatConfigFileContents.push(...imports);

  // Wrap the config in defineConfig
  const defineConfigNode = builders.callExpression(builders.identifier('defineConfig'), [
    builders.arrayExpression(configs),
  ]);
  // default export the defineConfig
  flatConfigFileContents.push(builders.exportDefaultDeclaration(defineConfigNode));
  // Print the AST to code.
  return recast.print(builders.program(flatConfigFileContents), {
    tabWidth: 2,
    trailingComma: true,
    lineTerminator: '\n',
  }).code;
}

function addConfigsToMigration(migration: Migration, config: Linter.ConfigOverride) {
  const configs: any[] = [];
  const properties: any[] = [];

  if (config.files) {
    const files = Array.isArray(config.files) ? config.files : [config.files];
    const filesArrayAST = builders.arrayExpression(files.map((file) => builders.literal(file)));
    properties.push(builders.property('init', builders.identifier('files'), filesArrayAST));
  }

  if (config.excludedFiles) {
    const excludedFiles = Array.isArray(config.excludedFiles) ? config.excludedFiles : [config.excludedFiles];
    const excludedFilesArrayAST = builders.arrayExpression(excludedFiles.map((file) => builders.literal(file)));
    properties.push(builders.property('init', builders.identifier('ignores'), excludedFilesArrayAST));
  }

  if (config.plugins) {
    properties.push(
      builders.property('init', builders.identifier('plugins'), generatePlugins(config.plugins, migration))
    );
  }

  legacyKeysToCopy.forEach((key) => {
    if (config[key]) {
      const value = typeof config[key] === 'object' ? generatePropValue(config[key]) : builders.literal(config[key]);
      properties.push(builders.property('init', builders.identifier(key), value));
    }
  });

  const hasObject = properties.some((p) => {
    if (p.key.type === 'Identifier') {
      return p.key.name !== 'files' && p.key.name !== 'ignores';
    }

    return true;
  });

  if (hasObject) {
    configs.push(builders.objectExpression(properties));
  }

  return configs;
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

function generateImports(migration: { imports: Map<string, { name?: string; modules: string[] }> }) {
  const imports: recast.types.namedTypes.ImportDeclaration[] = [];
  migration.imports.forEach(({ name, modules }, path) => {
    imports.push(
      name
        ? builders.importDeclaration(
            [builders.importDefaultSpecifier(builders.identifier(name))],
            builders.literal(path)
          )
        : builders.importDeclaration(
            modules.map((binding) => builders.importSpecifier(builders.identifier(binding))),
            builders.literal(path)
          )
    );
  });
  return imports;
}

function generatePlugins(plugins: string[], migration: Migration) {
  const props: recast.types.namedTypes.Property[] = [];

  plugins.forEach((plugin) => {
    const varName = getPluginVarName(plugin);
    const importName = getPluginImport(plugin);
    props.push(builders.property('init', builders.identifier(varName), builders.literal(importName)));
    migration.imports.set(importName, { name: varName, modules: [importName] });
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
