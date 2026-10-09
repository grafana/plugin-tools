import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import createDebug from 'debug';

const debug = createDebug('plugin-docs-cli:utils:plugin');

export interface PluginJson {
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
export async function resolvePluginJson(projectRoot?: string): Promise<PluginJson> {
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

/**
 * README locations in priority order, matching create-plugin's copyFiles rule: `src/README.md`
 * wins over the repo-root `README.md`.
 */
export function readmeCandidates(projectRoot?: string): string[] {
  const root = projectRoot || process.cwd();
  return [join(root, 'src', 'README.md'), join(root, 'README.md')];
}

/** Reads the first README candidate that exists. Returns undefined when none does. */
export async function readFirstReadme(candidates: string[]): Promise<string | undefined> {
  for (const candidate of candidates) {
    try {
      return await readFile(candidate, 'utf-8');
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT' && code !== 'EISDIR') {
        throw error;
      }
    }
  }
  debug('No README found in %O', candidates);
  return undefined;
}
