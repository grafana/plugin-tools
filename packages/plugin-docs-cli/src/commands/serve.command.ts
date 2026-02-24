import type minimist from 'minimist';
import createDebug from 'debug';
import { startServer } from '../server/server.js';

const debug = createDebug('plugin-docs-cli:serve');

export const serve = async (argv: minimist.ParsedArgs, docsPath: string) => {
  debug('Serve command invoked with args: %O', argv);

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
