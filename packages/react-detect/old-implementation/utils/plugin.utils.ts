import fs from 'fs';
import path from 'path';
import type { PluginMetadata } from '../types.js';

/**
 * Utility functions for plugin operations
 */

/**
 * Check if the current directory is a Grafana plugin directory
 *
 * @param directory Directory to check (defaults to cwd)
 * @returns True if this appears to be a plugin directory
 */
export function isPluginDirectory(directory: string = process.cwd()): boolean {
  const pluginJsonPath = path.join(directory, 'src', 'plugin.json');
  return fs.existsSync(pluginJsonPath);
}

/**
 * Load plugin metadata from plugin.json
 *
 * @param pluginRoot Root directory of the plugin
 * @returns Plugin metadata or default unknown values
 */
export function loadPluginMetadata(pluginRoot: string): PluginMetadata {
  const pluginJsonPath = path.join(pluginRoot, 'src', 'plugin.json');
  const pluginPackageJsonPath = path.join(pluginRoot, 'package.json');

  if (!fs.existsSync(pluginJsonPath)) {
    throw new Error(`Plugin.json not found at ${pluginJsonPath}`);
  }

  if (!fs.existsSync(pluginPackageJsonPath)) {
    throw new Error(`Package.json not found at ${pluginPackageJsonPath}`);
  }

  try {
    const content = fs.readFileSync(pluginJsonPath, 'utf8');
    const pluginJson = JSON.parse(content);
    const pluginPackageJson = JSON.parse(fs.readFileSync(pluginPackageJsonPath, 'utf8'));

    return {
      id: pluginJson.id || 'unknown',
      type: pluginJson.type || 'unknown',
      version: pluginPackageJson.version || 'unknown',
      name: pluginJson.name || 'unknown',
    };
  } catch (error) {
    console.error(`Error loading plugin.json from ${pluginJsonPath}:`, (error as Error).message);

    return {
      id: 'unknown',
      type: 'unknown',
      version: 'unknown',
      name: 'unknown',
    };
  }
}

/**
 * Find plugin metadata by navigating up from a file path
 *
 * @param filePath A file path within the plugin
 * @param pluginsRootDir Root directory containing plugins
 * @returns Plugin metadata or default unknown values
 */
export function getPluginMetadataFromFile(filePath: string, pluginsRootDir: string): PluginMetadata {
  let currentDir = path.dirname(filePath);

  // Navigate up until we find plugin.json or hit the plugins root
  while (currentDir !== pluginsRootDir && currentDir !== path.parse(currentDir).root) {
    const pluginJsonPath = path.join(currentDir, 'plugin.json');

    if (fs.existsSync(pluginJsonPath)) {
      try {
        const content = fs.readFileSync(pluginJsonPath, 'utf8');
        const pluginJson = JSON.parse(content);

        return {
          id: pluginJson.id || 'unknown',
          type: pluginJson.type || 'unknown',
          version: pluginJson.info?.version || 'unknown',
          name: pluginJson.name || 'unknown',
        };
      } catch (error) {
        console.error(`Error parsing plugin.json at ${pluginJsonPath}:`, (error as Error).message);
      }
    }

    currentDir = path.dirname(currentDir);
  }

  return {
    id: 'unknown',
    type: 'unknown',
    version: 'unknown',
    name: 'unknown',
  };
}
