import * as v from 'valibot';
import type { Context } from '../../../context.js';
import { assertAgentLoop, assertPluginType, setupDocsScaffolding } from './setup.js';

export const schema = v.object({
  docsPath: v.optional(
    v.pipe(
      v.string(),
      v.minLength(1, 'docsPath must not be empty.'),
      v.check(
        (value) => !value.startsWith('/') && !value.split('/').includes('..'),
        'docsPath must be a relative path without ".." segments.'
      )
    ),
    'docs'
  ),
  agentLoop: v.optional(
    v.union(
      [v.literal('claude'), v.literal('codex'), v.literal('cursor'), v.literal('none')],
      "--agentLoop must be one of: 'claude', 'codex', 'cursor' or 'none'."
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
