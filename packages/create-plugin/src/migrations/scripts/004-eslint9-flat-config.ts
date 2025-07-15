import { dirname, relative, resolve } from 'node:path';
import type { Context } from '../context.js';
import { parse } from 'jsonc-parser';
import * as recast from 'recast';
import type { Linter } from 'eslint';

const b = recast.types.builders;

interface Migration {
  imports: Map<string, { name?: string; modules: string[] }>;
}

const legacyKeysToCopy: Array<keyof Linter.LegacyConfig> = ['rules'];

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
  const imports = buildImports(migration);
  flatConfigFileContents.push(...imports);
  const configs = addConfigsToMigration(migration, config);
  // Wrap the config in defineConfig
  const defineConfigNode = b.callExpression(b.identifier('defineConfig'), [b.arrayExpression(configs)]);
  // default export the defineConfig
  flatConfigFileContents.push(b.exportDefaultDeclaration(defineConfigNode));
  // Print the AST to code.
  return recast.print(b.program(flatConfigFileContents), {
    tabWidth: 2,
    trailingComma: true,
    lineTerminator: '\n',
  }).code;
}

function addConfigsToMigration(migration: Migration, config: Linter.LegacyConfig) {
  const configs: any[] = [];
  const properties: any[] = [];

  legacyKeysToCopy.forEach((key) => {
    if (config[key]) {
      const value = typeof config[key] === 'object' ? generatePropValue(config[key]) : b.literal(config[key]);
      properties.push(b.property('init', b.identifier(key), value));
    }
  });

  const hasObject = properties.some((p) => {
    if (p.key.type === 'Identifier') {
      return p.key.name !== 'files' && p.key.name !== 'ignores';
    }

    return true;
  });

  if (hasObject) {
    configs.push(b.objectExpression(properties));
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
    return b.arrayExpression(value.map((i) => generatePropValue(i)));
  }
  if (value && typeof value === 'object') {
    const props = Object.keys(value).map((key) => {
      const propValue = value[key as keyof typeof value];
      const identifier = b.identifier(key);
      return b.property('init', identifier, generatePropValue(propValue));
    });
    return b.objectExpression(props);
  }
  return b.literal(value);
}

function buildImports(migration: { imports: Map<string, { name?: string; modules: string[] }> }) {
  const imports: recast.types.namedTypes.ImportDeclaration[] = [];
  migration.imports.forEach(({ name, modules }, path) => {
    imports.push(
      name
        ? b.importDeclaration([b.importDefaultSpecifier(b.identifier(name))], b.literal(path))
        : b.importDeclaration(
            modules.map((binding) => b.importSpecifier(b.identifier(binding))),
            b.literal(path)
          )
    );
  });
  return imports;
}

export function discoverRelativeLegacyConfigs(
  context: Context,
  configPath: string,
  discoveredConfigs: Map<string, Linter.LegacyConfig> = new Map()
): Map<string, Linter.LegacyConfig> {
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
