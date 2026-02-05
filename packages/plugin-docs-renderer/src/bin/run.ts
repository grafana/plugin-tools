#!/usr/bin/env node
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import minimist from 'minimist';
import createDebug from 'debug';
import { startServer } from '../server.js';

const debug = createDebug('plugin-docs-renderer:cli');

async function commandServe(docsPath: string, port: number, liveReload: boolean) {
  debug('Command serve: docsPath=%s, port=%d, liveReload=%s', docsPath, port, liveReload);

  try {
    startServer({
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
  }
}

async function main() {
  debug('CLI invoked with args: %O', process.argv.slice(2));

  const argv = minimist(process.argv.slice(2), {
    boolean: ['reload'],
    string: ['port'],
    alias: {
      p: 'port',
      r: 'reload',
    },
    default: {
      port: '3001',
      reload: false,
    },
  });

  const docsPath = resolve(argv._[0] || './docs');
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
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(`Error: Invalid port: ${argv.port}`);
    process.exit(1);
  }

  await commandServe(docsPath, port, argv.reload);
}

main();
