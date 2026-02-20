import createDebug from 'debug';
import { validate } from '../validation/engine.js';
import { allRules } from '../validation/rules/index.js';

const debug = createDebug('plugin-docs-cli:validate');

export async function validateCommand(docsPath: string): Promise<void> {
  debug('Validating docs at: %s', docsPath);

  const result = await validate({ docsPath }, allRules);

  console.log(JSON.stringify(result, null, 2));

  process.exitCode = result.valid ? 0 : 1;
}
