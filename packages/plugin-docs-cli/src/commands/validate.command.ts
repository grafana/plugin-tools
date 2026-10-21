import createDebug from 'debug';
import type { SnippetValues } from '@grafana/plugin-docs-parser';
import { validate } from '../validation/engine.js';
import { formatResult } from '../validation/format.js';
import { allRules } from '../validation/rules/index.js';
import { guidesLocation } from '../utils/utils.guides.js';
import { Rule } from '../validation/types.js';

const debug = createDebug('plugin-docs-cli:validate');

/**
 * Reports that the built docs could not be located at all, in the same JSON shape as a validation run
 * so a consumer of `--json` never has to parse stderr.
 */
export function reportUnresolvedBuiltDocs(detail: string): void {
  console.log(
    JSON.stringify(
      {
        valid: false,
        diagnostics: [{ rule: Rule.DocsPathExists, severity: 'error', title: 'Built docs not found', detail }],
        guide: guidesLocation(),
      },
      null,
      2
    )
  );
  process.exitCode = 1;
}

export async function validateCommand(
  docsPath: string,
  options: {
    json: boolean;
    pluginType?: string;
    mode?: 'source' | 'dist';
    docsPathSetting?: string;
    snippetValues?: SnippetValues;
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

  const result = await validate(
    {
      docsPath,
      pluginType: options.pluginType,
      mode,
      docsPathSetting: options.docsPathSetting,
      snippetValues: options.snippetValues,
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
