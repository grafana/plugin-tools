import * as v from 'valibot';
import type { Context } from '../../context.js';
import { assertPluginType, setupDocsScaffolding } from '../docs-scaffolding.js';

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
});

type Options = v.InferOutput<typeof schema>;

export default function panelDocs(context: Context, options: Options): Context {
  assertPluginType(context, { expectedType: 'panel', codemodName: 'panel-docs' });
  return setupDocsScaffolding({
    context,
    docsPath: options.docsPath,
    // templates live in the package-root `templates/` folder alongside every other template set,
    // split by plugin type so a future datasource-docs codemod reuses `docs/common/`. this file sits
    // four levels below the package root in both `src/` and `dist/` - rollup mirrors the tree - so
    // the same relative URL resolves from source and from the built package with no copy step.
    // `templates/docs` is deliberately absent from TEMPLATE_PATHS, so `generate` ignores it until we
    // scaffold docs for every new plugin.
    templateBaseUrl: new URL('../../../../templates/docs/panel/', import.meta.url),
    commonTemplateBaseUrl: new URL('../../../../templates/docs/common/', import.meta.url),
    codemodName: 'panel-docs',
  });
}
