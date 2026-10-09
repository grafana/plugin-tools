import { join, normalize } from 'node:path';
import { Context } from './context.js';
import { addDependenciesToPackageJson } from './utils.js';
import { PluginEntry } from '../utils/utils.project.js';

// Turns a plugin-relative path (e.g. `src/plugin.json`) into a path relative to the project root.
export type PluginPathResolver = (pluginRelativePath: string) => string;

/**
 * Calls `callback` once for every plugin in the project. Codemods must use this for per-plugin files
 * (`src/plugin.json`, the plugin `package.json`, wrapper configs, `docker-compose.yaml`, `go.mod`) so they
 * work for a single plugin and for every plugin in a monorepo.
 */
export function forEachPlugin(
  context: Context,
  callback: (plugin: PluginEntry, resolvePath: PluginPathResolver) => void
) {
  for (const plugin of context.project.plugins) {
    callback(plugin, (pluginRelativePath) => normalize(join(plugin.dir, pluginRelativePath)));
  }
}

/**
 * Adds tooling devDependencies (bundlers, test runners, linters) to the root `package.json`.
 */
export function addToolingDependencies(context: Context, devDependencies: Record<string, string>) {
  addDependenciesToPackageJson(context, {}, devDependencies, 'package.json');
}

/**
 * Adds dependencies to a single plugin's `package.json`.
 */
export function addPluginDependencies(
  context: Context,
  plugin: PluginEntry,
  dependencies: Record<string, string>,
  devDependencies: Record<string, string> = {}
) {
  addDependenciesToPackageJson(context, dependencies, devDependencies, join(plugin.dir, 'package.json'));
}
