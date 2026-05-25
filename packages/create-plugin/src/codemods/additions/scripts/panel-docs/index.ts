import * as v from 'valibot';
import type { Context } from '../../../context.js';
import { assertAgentLoop, assertPluginType, setupDocsScaffolding } from '../_docs-shared/setup.js';

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

export default function panelDocs(context: Context, options: Options): Context {
  assertAgentLoop(options.agentLoop);
  assertPluginType(context, { expectedType: 'panel', codemodName: 'panel-docs' });
  return setupDocsScaffolding({
    context,
    docsPath: options.docsPath,
    templateBaseUrl: new URL('./templates/', import.meta.url),
    codemodName: 'panel-docs',
    agentLoop: options.agentLoop,
  });
}
