import semver from 'semver';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConfig } from './utils.config.js';
import { getPluginJson } from './utils.plugin.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Returns the version of the @grafana/create-plugin runtime (not the version of the plugins)
export function getRuntimeVersion(): string {
  const packageJsonPath = resolve(__dirname, '..', '..', 'package.json');
  const pkg = readFileSync(packageJsonPath, 'utf8');
  const { version } = JSON.parse(pkg);
  if (!version) {
    throw `Could not find the version of create-plugin`;
  }
  return version;
}

// Returns the version of the @grafana/create-plugin that was used to update or scaffold a plugin
export function getScaffoldedVersion() {
  const { version } = getConfig();

  return version;
}

// Checks if the version of @grafana/create-plugin that was last used to scaffold / update a plugin is older than the latest version
export function isScaffoldedVersionOutdated() {
  const runtimeVersion = getRuntimeVersion();
  const scaffoldedVersion = getScaffoldedVersion();

  return semver.gt(runtimeVersion, scaffoldedVersion);
}

export function getMinSupportedGrafanaVersion() {
  const pluginJson = getPluginJson();
  const dependency = pluginJson.dependencies.grafanaDependency || pluginJson.dependencies.grafanaVersion; // falling back to the deprecated value

  return semver.minVersion(dependency);
}
