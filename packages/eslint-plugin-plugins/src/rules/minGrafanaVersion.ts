import semver from 'semver';
import fs from 'fs';
import type { TSESLint } from '@typescript-eslint/utils';
import type { MessageIds, Options } from './types';

export function getMinSupportedVersionFromPackageJson(): string {
  const path = process.cwd() + '/src/plugin.json';

  if (!fs.existsSync(path)) {
    throw new Error("Couldn't find src/plugin.json in the current working directory");
  }

  const pluginJson = require(path);
  const minVersion = semver.minVersion(pluginJson.dependencies.grafanaDependency);
  if (!minVersion) {
    throw new Error('Could not determine minimum supported version from package.json');
  }

  return minVersion.toString();
}

export function getMinSupportedGrafanaVersion(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>) {
  if (context.options.length && context.options[0].minGrafanaVersion !== undefined) {
    return context.options[0].minGrafanaVersion;
  }
  return getMinSupportedVersionFromPackageJson();
}
