import * as v from 'valibot';
import type { Context } from '../../../context.js';
import {
  type ConditionalFilePredicate,
  assertAgentLoop,
  assertPluginType,
  setupDocsScaffolding,
  sourceContainsVariableSupport,
  sourceIsSqlDatasource,
} from '../_docs-shared/setup.js';

export const schema = v.object({
  docsPath: v.optional(v.string(), 'docs'),
  // agentLoop is optional at the valibot level so we can produce a friendlier
  // missing-field error via `assertAgentLoop` in the entrypoint below. Valid
  // present-but-invalid values still get rejected by the union.
  agentLoop: v.optional(
    v.union(
      [v.literal('claude'), v.literal('codex'), v.literal('cursor'), v.literal('none')],
      "--agent-loop must be one of: 'claude', 'codex', 'cursor' or 'none'."
    )
  ),
});

type Options = v.InferOutput<typeof schema>;

const CONDITIONAL_FILES: Record<string, ConditionalFilePredicate> = {
  'macros.md': ({ basePath }) => sourceIsSqlDatasource(basePath),
  'dashboard.md': ({ pluginJson }) => pluginJson.includes?.some((i) => i.type === 'dashboard') ?? false,
  'template-variables.md': ({ basePath }) => sourceContainsVariableSupport(basePath),
  'annotations.md': ({ pluginJson }) => pluginJson.annotations === true,
  'alerting.md': ({ pluginJson }) => pluginJson.alerting === true && pluginJson.backend === true,
};

export default function datasourceDocs(context: Context, options: Options): Context {
  assertAgentLoop(options.agentLoop);
  assertPluginType(context, { expectedType: 'datasource', codemodName: 'datasource-docs' });
  return setupDocsScaffolding({
    context,
    docsPath: options.docsPath,
    templateBaseUrl: new URL('./templates/', import.meta.url),
    codemodName: 'datasource-docs',
    conditionalFiles: CONDITIONAL_FILES,
    agentLoop: options.agentLoop,
  });
}
