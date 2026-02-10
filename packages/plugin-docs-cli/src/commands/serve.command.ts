import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import type minimist from 'minimist';
import createDebug from 'debug';
import { startServer } from '../server/server.js';

const debug = createDebug('plugin-docs-cli:serve');

export const serve = async (argv: minimist.ParsedArgs) => {
  debug('Serve command invoked with args: %O', argv);

  const docsPath = resolve(argv._[0]?.toString() || './docs');
  debug('Resolved docs path: %s', docsPath);

  // check if the path exists
  try {
    await access(docsPath);
  } catch {
    console.error(`Error: Path not found: ${docsPath}`);
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
