#!/usr/bin/env node
import { stat } from 'node:fs/promises';
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
    console.error('  validate   Validate documentation (--json for machine-readable output,');
    console.error('             --allow-unfilled-stubs while docs are still being written,');
    console.error('             --no-style to skip writing-style rules)');
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

  // `serve` and `build` need a real folder to do anything useful, so fail fast here with a
  // friendly message. `validate` reports a missing or invalid docsPath as a normal diagnostic
  // instead (the `docs-path-exists` rule), so its --json output stays well-formed either way.
  if (command !== 'validate') {
    try {
      const st = await stat(docsPath);
      if (!st.isDirectory()) {
        console.error(`Error: Not a directory: ${docsPath}`);
        console.error('Check that the "docsPath" in src/plugin.json points to a directory, not a file.');
        process.exit(1);
      }
    } catch {
      console.error(`Error: Path not found: ${docsPath}`);
      console.error('Check that the "docsPath" in src/plugin.json points to an existing directory.');
      process.exit(1);
    }
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
        boolean: ['strict', 'json', 'allow-unfilled-stubs', 'style'],
        string: ['style-level'],
        default: {
          strict: true,
          json: false,
          'allow-unfilled-stubs': false,
          style: true,
        },
      });
      // `--no-style` turns writing-style rules off; `--style-level=error` opts into failing on
      // them, which is off by default so house style never blocks a plugin release.
      const style = !validateArgv.style ? 'off' : validateArgv['style-level'] === 'error' ? 'error' : 'on';
      await validateCommand(docsPath, {
        strict: validateArgv.strict,
        json: validateArgv.json,
        allowUnfilledStubs: validateArgv['allow-unfilled-stubs'],
        style,
      });
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
