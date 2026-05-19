import type { Context } from '../../../context.js';
import { type CatalogDocsOptions, schema } from './schema.js';

export { schema };

export default function catalogDocs(context: Context, _options: CatalogDocsOptions): Context {
  return context;
}
