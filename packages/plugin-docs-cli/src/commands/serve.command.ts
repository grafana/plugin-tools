import { access } from 'node:fs/promises';
import type minimist from 'minimist';
import createDebug from 'debug';
import { startServer } from '../server/server.js';
import { resolveDocsPath } from '../utils/utils.plugin.js';

const debug = createDebug('plugin-docs-cli:serve');

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
