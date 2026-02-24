import createDebug from 'debug';
import { validate } from '../validation/engine.js';
import { allRules } from '../validation/rules/index.js';

const debug = createDebug('plugin-docs-cli:validate');

export async function validateCommand(
  docsPath: string,
  options: { strict: boolean } = { strict: true }
): Promise<void> {
  debug('Validating docs at: %s (strict: %s)', docsPath, options.strict);

  const result = await validate({ docsPath, strict: options.strict }, allRules);

  console.log(JSON.stringify(result, null, 2));

  process.exitCode = result.valid ? 0 : 1;
}
