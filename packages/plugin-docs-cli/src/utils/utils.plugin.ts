import { readFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import createDebug from 'debug';

const debug = createDebug('plugin-docs-cli:utils:plugin');

export interface PluginJson {
  docsPath: string;
  pluginType?: string;
}

async function readPluginJson(pluginJsonPath: string, label: string, notFoundMessage: string) {
  debug('Looking for plugin.json at: %s', pluginJsonPath);

  let raw: string;
  try {
    raw = await readFile(pluginJsonPath, 'utf-8');
  } catch {
    throw new Error(notFoundMessage);
  }

  let pluginJson: { docsPath?: string; type?: string };
  try {
    pluginJson = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse ${pluginJsonPath}: ${error instanceof Error ? error.message : error}`);
  }

  if (!pluginJson.docsPath) {
    throw new Error(`"docsPath" is not set in ${label}`);
  }

  return { docsPath: pluginJson.docsPath, pluginType: pluginJson.type };
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
  const { docsPath, pluginType } = await readPluginJson(
    join(root, 'src', 'plugin.json'),
    'src/plugin.json',
    `Could not find src/plugin.json in ${root}`
  );

  const resolved = resolve(root, docsPath);
  debug('Resolved docsPath from plugin.json: %s -> %s', docsPath, resolved);
  return { docsPath: resolved, pluginType };
}

/**
 * Resolves the built docs folder of a built plugin, where `plugin.json` sits at the root. This is the
 * layout of `dist/` after a plugin build and of an extracted plugin archive.
 *
 * @param distRoot - The root of the built plugin
 * @returns The resolved absolute path to the built docs directory, and the plugin's type
 * @throws {Error} If plugin.json is missing, lacks docsPath or points outside distRoot
 */
export async function resolveBuiltPluginJson(distRoot: string): Promise<PluginJson> {
  const root = resolve(distRoot);
  const { docsPath, pluginType } = await readPluginJson(
    join(root, 'plugin.json'),
    'plugin.json',
    `Could not find plugin.json in ${root}. Build the plugin and run the docs build first.`
  );

  const resolved = resolve(root, docsPath);
  if (resolved === root || relative(root, resolved).startsWith('..') || isAbsolute(relative(root, resolved))) {
    throw new Error(`"docsPath" in ${join(root, 'plugin.json')} must point to a folder inside ${root}`);
  }

  debug('Resolved built docsPath: %s -> %s', docsPath, resolved);
  return { docsPath: resolved, pluginType };
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
