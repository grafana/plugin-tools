import * as v from 'valibot';
import type { Context } from '../../../context.js';
import {
  type ConditionalFilePredicate,
  assertPluginType,
  setupDocsScaffolding,
  sourceContainsVariableSupport,
} from '../_docs-shared/setup.js';

export const schema = v.object({
  docsPath: v.optional(v.string(), 'docs'),
});

type Options = v.InferOutput<typeof schema>;

const CONDITIONAL_FILES: Record<string, ConditionalFilePredicate> = {
  'template-variables.md': ({ basePath }) => sourceContainsVariableSupport(basePath),
  'annotations.md': ({ pluginJson }) => pluginJson.annotations === true,
  'alerting.md': ({ pluginJson }) => pluginJson.alerting === true && pluginJson.backend === true,
};

export default function datasourceDocs(context: Context, options: Options): Context {
  assertPluginType(context, { expectedType: 'datasource', codemodName: 'datasource-docs' });
  return setupDocsScaffolding({
    context,
    docsPath: options.docsPath,
    templateBaseUrl: new URL('./templates/', import.meta.url),
    codemodName: 'datasource-docs',
    conditionalFiles: CONDITIONAL_FILES,
  });
}
