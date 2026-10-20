#!/usr/bin/env node
import { stat } from 'node:fs/promises';
import minimist from 'minimist';
import createDebug from 'debug';
import { resolve } from 'node:path';
import { readmeCandidates, resolveBuiltPluginJson, resolvePluginJson } from '../utils/utils.plugin.js';
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
    console.error('  validate   Validate documentation (--json for machine-readable output)');
    console.error('             --dist [dir] validates the built docs of the plugin in dir (default: dist)');
    process.exit(1);
  }

  const validateArgv = minimist(process.argv.slice(3), {
    boolean: ['json'],
    string: ['dist'],
    default: {
      json: false,
    },
  });
  // a bare `--dist` checks `./dist`, and `--dist <dir>` the built plugin in <dir>
  const distRoot =
    command === 'validate' && validateArgv.dist !== undefined ? resolve(validateArgv.dist || 'dist') : undefined;

  // resolve docs path and plugin type once for all commands.
  let docsPath: string;
  let pluginType: string | undefined;
  try {
    ({ docsPath, pluginType } = distRoot ? await resolveBuiltPluginJson(distRoot) : await resolvePluginJson());
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
      await serve(serveArgv, docsPath, pluginType, readmeCandidates());
      break;
    }
    case 'build': {
      await buildDocs(process.cwd(), docsPath);
      break;
    }
    case 'validate': {
      await validateCommand(docsPath, {
        json: validateArgv.json,
        pluginType,
        mode: distRoot ? 'dist' : 'source',
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
