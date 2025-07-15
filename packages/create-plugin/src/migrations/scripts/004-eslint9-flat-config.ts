import { dirname, relative, resolve } from 'node:path';
import type { Context } from '../context.js';
import { parse } from 'jsonc-parser';
import type { Linter } from 'eslint';

export default function migrate(context: Context): Context {
  const discoveredConfigs = discoverRelativeLegacyConfigs(context, '.eslintrc');

  for (const [legacyFilePath, _] of discoveredConfigs.entries()) {
    // Write the flat config file.
    const flatConfigFilePath = context.normalisePath(legacyFilePath).replace('.eslintrc', 'eslint.config.mjs');
    context.addFile(flatConfigFilePath, `export default ${JSON.stringify({ legacyFilePath }, null, 2)}`);
    // Delete the legacy config file.
    context.deleteFile(legacyFilePath);
  }

  return context;
}

export function migrateLegacyConfig(context: Context, config: Linter.LegacyConfig) {
  console.log(config);
}

export function discoverRelativeLegacyConfigs(
  context: Context,
  configPath: string,
  discoveredConfigs: Map<string, unknown> = new Map()
): Map<string, unknown> {
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
