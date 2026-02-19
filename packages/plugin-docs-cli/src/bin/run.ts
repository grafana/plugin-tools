#!/usr/bin/env node
import minimist from 'minimist';
import createDebug from 'debug';
import { serve } from '../commands/serve.command.js';
import { build } from '../commands/build.command.js';

const debug = createDebug('plugin-docs-cli:main');

async function main() {
  const argv = minimist(process.argv.slice(2));

  debug('CLI invoked with args: %O', argv);

  const command = argv._[0];

  if (!command) {
    console.error('Usage: plugin-docs-cli <command> [options]');
    console.error('');
    console.error('Commands:');
    console.error('  serve   Start the local docs preview server');
    console.error('  build   Build docs for publishing (generates manifest, copies to dist/)');
    process.exit(1);
  }

  switch (command) {
    case 'serve': {
      const serveArgv = minimist(process.argv.slice(3), {
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
      await serve(serveArgv);
      break;
    }
    case 'build': {
      await build();
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
