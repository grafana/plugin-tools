#!/usr/bin/env node
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import minimist from 'minimist';
import { startServer } from '../server.js';

async function commandServe(docsPath: string, port: number, liveReload: boolean) {
  console.log('Starting development server...\n');

  try {
    startServer({
      docsPath,
      port,
      liveReload,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error starting server:', error.message);
    } else {
      console.error('Error starting server:', error);
    }
    process.exit(1);
  }
}

async function main() {
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
