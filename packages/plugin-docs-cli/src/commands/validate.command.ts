import createDebug from 'debug';
import { validate } from '../validation/engine.js';
import { formatResult } from '../validation/format.js';
import { allRules } from '../validation/rules/index.js';
import { guidesLocation } from '../utils/utils.guides.js';

const debug = createDebug('plugin-docs-cli:validate');

export async function validateCommand(
  docsPath: string,
  options: {
    json: boolean;
    pluginType?: string;
    mode?: 'source' | 'dist';
  } = { json: false }
): Promise<void> {
  const mode = options.mode ?? 'source';
  debug(
    'Validating docs at: %s (json: %s, pluginType: %s, mode: %s)',
    docsPath,
    options.json,
    options.pluginType,
    mode
  );

  const result = await validate({ docsPath, pluginType: options.pluginType, mode }, allRules);

  const guide = guidesLocation();
  if (options.json) {
    console.log(JSON.stringify({ ...result, guide }, null, 2));
  } else {
    console.log(formatResult(result));
    console.log(`\nDocs guides: ${guide}`);
  }

  process.exitCode = result.valid ? 0 : 1;
}
