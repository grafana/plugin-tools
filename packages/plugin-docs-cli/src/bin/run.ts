#!/usr/bin/env node
import { access } from 'node:fs/promises';
import minimist from 'minimist';
import createDebug from 'debug';
import { resolveDocsPath } from '../utils/utils.plugin.js';
import { serve } from '../commands/serve.command.js';
import { buildDocs } from '../commands/build.command.js';
import { validateCommand } from '../commands/validate.command.js';

const debug = createDebug('plugin-docs-cli:main');

async function main() {
  const argv = minimist(process.argv.slice(2));

  debug('CLI invoked with args: %O', argv);

  const command = argv._[0];

  if (!command) {
    console.error('Usage: plugin-docs-cli <command> [options]');
    console.error('');
    console.error('Commands:');
    console.error('  serve      Start the local docs preview server');
    console.error('  build      Build docs for publishing (generates manifest, copies to dist/)');
    console.error('  validate   Validate documentation (--json, --strict)');
    process.exit(1);
  }

  // resolve docs path once for all commands.
  let docsPath: string;
  try {
    docsPath = await resolveDocsPath();
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }

  try {
    await access(docsPath);
  } catch {
    console.error(`Error: Path not found: ${docsPath}`);
    console.error('Check that the "docsPath" in src/plugin.json points to an existing directory.');
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
      await serve(serveArgv, docsPath);
      break;
    }
    case 'build': {
      await buildDocs(process.cwd(), docsPath);
      break;
    }
    case 'validate': {
      const validateArgv = minimist(process.argv.slice(3), {
        boolean: ['json', 'strict'],
        default: {
          json: false,
          strict: false,
        },
      });
      await validateCommand(validateArgv, docsPath);
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
