import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import createDebug from 'debug';

const debug = createDebug('plugin-docs-cli:utils:plugin');

/**
 * Resolves the docs path by reading docsPath from src/plugin.json.
 *
 * @param projectRoot - The root directory of the plugin project (defaults to cwd)
 * @returns The resolved absolute path to the docs directory
 * @throws {Error} If plugin.json is missing or lacks docsPath
 */
export async function resolveDocsPath(projectRoot?: string): Promise<string> {
  const root = projectRoot || process.cwd();
  const pluginJsonPath = join(root, 'src', 'plugin.json');
  debug('Looking for plugin.json at: %s', pluginJsonPath);

  let raw: string;
  try {
    raw = await readFile(pluginJsonPath, 'utf-8');
  } catch {
    throw new Error(`Could not find src/plugin.json in ${root}`);
  }

  const pluginJson: { docsPath?: string } = JSON.parse(raw);

  if (!pluginJson.docsPath) {
    throw new Error('"docsPath" is not set in src/plugin.json');
  }

  const docsPath = resolve(root, pluginJson.docsPath);
  debug('Resolved docsPath from plugin.json: %s -> %s', pluginJson.docsPath, docsPath);
  return docsPath;
}
