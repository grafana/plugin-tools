import createDebug from 'debug';
import { validate } from '../validation/engine.js';
import { formatResult } from '../validation/format.js';
import { allRules } from '../validation/rules/index.js';

const debug = createDebug('plugin-docs-cli:validate');

export async function validateCommand(
  docsPath: string,
  options: {
    strict: boolean;
    json: boolean;
    allowUnfilledStubs?: boolean;
    style?: 'on' | 'off' | 'error';
  } = { strict: true, json: false }
): Promise<void> {
  debug(
    'Validating docs at: %s (strict: %s, json: %s, allowUnfilledStubs: %s, style: %s)',
    docsPath,
    options.strict,
    options.json,
    options.allowUnfilledStubs ?? false,
    options.style ?? 'on'
  );

  const result = await validate(
    {
      docsPath,
      strict: options.strict,
      allowUnfilledStubs: options.allowUnfilledStubs,
      style: options.style,
    },
    allRules
  );

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatResult(result));
  }

  process.exitCode = result.valid ? 0 : 1;
}
