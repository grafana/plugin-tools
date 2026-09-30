import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import createDebug from 'debug';

const debug = createDebug('plugin-docs-cli:utils:plugin');

export interface PluginConfig {
  docsPath: string;
  pluginType?: string;
}

/**
 * Resolves the docs path and plugin type by reading src/plugin.json.
 *
 * @param projectRoot - The root directory of the plugin project (defaults to cwd)
 * @returns The resolved absolute path to the docs directory, and the plugin's type
 * @throws {Error} If plugin.json is missing or lacks docsPath
 */
export async function resolvePluginConfig(projectRoot?: string): Promise<PluginConfig> {
  const root = projectRoot || process.cwd();
  const pluginJsonPath = join(root, 'src', 'plugin.json');
  debug('Looking for plugin.json at: %s', pluginJsonPath);

  let raw: string;
  try {
    raw = await readFile(pluginJsonPath, 'utf-8');
  } catch {
    throw new Error(`Could not find src/plugin.json in ${root}`);
  }

  let pluginJson: { docsPath?: string; type?: string };
  try {
    pluginJson = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse ${pluginJsonPath}: ${error instanceof Error ? error.message : error}`);
  }

  if (!pluginJson.docsPath) {
    throw new Error('"docsPath" is not set in src/plugin.json');
  }

  const docsPath = resolve(root, pluginJson.docsPath);
  debug('Resolved docsPath from plugin.json: %s -> %s', pluginJson.docsPath, docsPath);
  return { docsPath, pluginType: pluginJson.type };
}
