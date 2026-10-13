import createDebug from 'debug';
import { validate } from '../validation/engine.js';
import { formatResult } from '../validation/format.js';
import { allRules } from '../validation/rules/index.js';

const debug = createDebug('plugin-docs-cli:validate');

export async function validateCommand(
  docsPath: string,
  options: {
    json: boolean;
    pluginType?: string;
  } = { json: false }
): Promise<void> {
  debug('Validating docs at: %s (json: %s, pluginType: %s)', docsPath, options.json, options.pluginType);

  const result = await validate({ docsPath, pluginType: options.pluginType }, allRules);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatResult(result));
  }

  process.exitCode = result.valid ? 0 : 1;
}
