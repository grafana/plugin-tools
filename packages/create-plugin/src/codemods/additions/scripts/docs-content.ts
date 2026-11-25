import type { Context } from '../../context.js';
import { assertDocsSetUp } from './docs.js';

// the agent step does the writing. this only stops it from starting on a plugin with no docs pages to fill
export default function docsContent(context: Context): Context {
  assertDocsSetUp(context, 'docs-content');
  return context;
}
