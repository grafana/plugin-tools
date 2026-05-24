import * as v from 'valibot';
import type { Context } from '../../../context.js';
import { assertPluginType, setupDocsScaffolding } from '../_docs-shared/setup.js';

export const schema = v.object({
  docsPath: v.optional(v.string(), 'docs'),
});

type Options = v.InferOutput<typeof schema>;

export default function panelDocs(context: Context, options: Options): Context {
  assertPluginType(context, { expectedType: 'panel', codemodName: 'panel-docs' });
  return setupDocsScaffolding({
    context,
    docsPath: options.docsPath,
    templateBaseUrl: new URL('./templates/', import.meta.url),
    codemodName: 'panel-docs',
  });
}
