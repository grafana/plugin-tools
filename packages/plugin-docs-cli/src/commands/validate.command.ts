import type minimist from 'minimist';
import createDebug from 'debug';
import { validate } from '../validation/engine.js';
import { allRules } from '../validation/rules/index.js';
import { formatHuman, formatJson } from '../validation/format.js';

const debug = createDebug('plugin-docs-cli:validate');

export async function validateCommand(argv: minimist.ParsedArgs, docsPath: string): Promise<void> {
  debug('Validate command invoked with args: %O', argv);

  const json = argv.json || false;
  const strict = argv.strict || false;

  debug('Validating docs at: %s (strict: %s)', docsPath, strict);

  const result = await validate({ docsPath }, 'release', allRules, { strict });

  if (json) {
    console.log(formatJson(result));
  } else {
    console.log(formatHuman(result));
  }

  process.exit(result.valid ? 0 : 1);
}
