import createDebug from 'debug';
import { validate } from '../validation/engine.js';
import { formatResult } from '../validation/format.js';
import { allRules } from '../validation/rules/index.js';
import { guidesLocation } from '../utils/utils.guides.js';

const debug = createDebug('plugin-docs-cli:validate');

export async function validateCommand(
  docsPath: string,
  options: {
    strict: boolean;
    json: boolean;
    allowUnfilledStubs?: boolean;
    pluginType?: string;
  } = { strict: true, json: false }
): Promise<void> {
  debug(
    'Validating docs at: %s (strict: %s, json: %s, allowUnfilledStubs: %s, pluginType: %s)',
    docsPath,
    options.strict,
    options.json,
    options.allowUnfilledStubs ?? false,
    options.pluginType
  );

  const result = await validate(
    {
      docsPath,
      strict: options.strict,
      allowUnfilledStubs: options.allowUnfilledStubs,
      pluginType: options.pluginType,
    },
    allRules
  );

  const guide = guidesLocation();
  if (options.json) {
    console.log(JSON.stringify({ ...result, guide }, null, 2));
  } else {
    console.log(formatResult(result));
    console.log(`\nDocs guides: ${guide}`);
  }

  process.exitCode = result.valid ? 0 : 1;
}
