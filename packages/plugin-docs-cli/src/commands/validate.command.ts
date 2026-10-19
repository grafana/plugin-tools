import createDebug from 'debug';
import type { SnippetValues } from '@grafana/plugin-docs-parser';
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
    snippetValues?: SnippetValues;
  } = { json: false }
): Promise<void> {
  debug('Validating docs at: %s (json: %s, pluginType: %s)', docsPath, options.json, options.pluginType);

  const result = await validate(
    { docsPath, pluginType: options.pluginType, snippetValues: options.snippetValues },
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
