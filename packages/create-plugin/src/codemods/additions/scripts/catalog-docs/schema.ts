import * as v from 'valibot';

export const schema = v.object({
  docsPath: v.optional(v.string(), 'docs'),
});

export type CatalogDocsOptions = v.InferOutput<typeof schema>;
