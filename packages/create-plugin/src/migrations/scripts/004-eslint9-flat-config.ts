import type { Context } from '../context.js';
import { parse } from 'jsonc-parser';

export default function migrate(context: Context): Context {
  const discoveredConfigs = discoverLegacyConfigs(context, '.eslintrc');

  for (const [legacyFilePath, _] of discoveredConfigs.entries()) {
    // Write the flat config file.
    const flatConfigFilePath = context.normalisePath(legacyFilePath).replace('.eslintrc', 'eslint.config.mjs');
    context.addFile(flatConfigFilePath, `export default ${JSON.stringify({ legacyFilePath }, null, 2)}`);
    // Delete the legacy config file.
    context.deleteFile(legacyFilePath);
  }

  return context;
}

function discoverLegacyConfigs(
  context: Context,
  configPath: string,
  discoveredConfigs: Map<string, string> = new Map()
) {
  if (discoveredConfigs.has(configPath)) {
    return discoveredConfigs;
  }

  if (!context.doesFileExist(configPath)) {
    return discoveredConfigs;
  }
  const config = parseJsonConfig(context, configPath);

  discoveredConfigs.set(configPath, config);

  if (config.extends) {
    const relativeExtends = getRelativeExtends(config.extends);
    for (const relativeExtend of relativeExtends) {
      return discoverLegacyConfigs(context, relativeExtend, discoveredConfigs);
    }
  }

  return discoveredConfigs;
}

function parseJsonConfig(context: Context, legacyConfigPath: string) {
  const legacyEslintConfigRaw = context.getFile(legacyConfigPath) ?? '';
  return parse(legacyEslintConfigRaw);
}

function getRelativeExtends(extendsConfig: string | string[]): string[] {
  const extendsArray = Array.isArray(extendsConfig) ? extendsConfig : [extendsConfig];
  return extendsArray.filter(
    (extend) =>
      extend.startsWith('./') || extend.startsWith('../') || (extend.startsWith('.') && !extend.startsWith('@'))
  );
}
