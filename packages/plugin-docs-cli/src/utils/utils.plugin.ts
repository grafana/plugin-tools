import { readFile, stat } from 'node:fs/promises';
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

  let pluginJson: { docsPath?: string };
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
  return docsPath;
}

/**
 * Resolves the plugin's README, matching create-plugin's copyFiles rule: `src/README.md` when
 * it exists, otherwise the repo-root `README.md`. Returns undefined when neither exists.
 */
export async function resolveReadmePath(projectRoot?: string): Promise<string | undefined> {
  const root = projectRoot || process.cwd();
  const candidates = [join(root, 'src', 'README.md'), join(root, 'README.md')];
  for (const candidate of candidates) {
    try {
      const st = await stat(candidate);
      if (st.isFile()) {
        debug('Resolved README path: %s', candidate);
        return candidate;
      }
    } catch {}
  }
  debug('No README found under %s', root);
  return undefined;
}
