import { access, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import type minimist from 'minimist';
import createDebug from 'debug';
import { startServer } from '../server/server.js';

const debug = createDebug('plugin-docs-cli:serve');

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

export const serve = async (argv: minimist.ParsedArgs) => {
  debug('Serve command invoked with args: %O', argv);

  let docsPath: string;
  try {
    docsPath = await resolveDocsPath();
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }

  // check if the path exists
  try {
    await access(docsPath);
  } catch {
    console.error(`Error: Path not found: ${docsPath}`);
    console.error('Check that the "docsPath" in src/plugin.json points to an existing directory.');
    process.exit(1);
  }

  // parse port
  const port = parseInt(argv.port, 10);
  if (isNaN(port)) {
    console.error(`Error: Invalid port: ${argv.port}`);
    process.exit(1);
  }

  const liveReload = argv.reload || false;

  try {
    await startServer({
      docsPath,
      port,
      liveReload,
    });
  } catch (error) {
    debug('Failed to start server: %O', error);
    if (error instanceof Error) {
      console.error('Error starting server:', error.message);
    } else {
      console.error('Error starting server:', error);
    }
    process.exit(1);
  }
};
