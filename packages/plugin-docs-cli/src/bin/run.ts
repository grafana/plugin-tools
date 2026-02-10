#!/usr/bin/env node
import minimist from 'minimist';
import createDebug from 'debug';
import { serve } from '../commands/serve.command.js';

const debug = createDebug('plugin-docs-cli:main');

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

  // Default to serve command for now
  await serve(argv);
}

main();
