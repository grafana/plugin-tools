import type { Context } from '../../context.js';
import { readJsonFile } from '../../utils.js';
import { assertSupportedPluginType } from './docs.js';

// the agent step does the writing. this only stops it from starting on a plugin with no docs pages to fill
export default function docsContent(context: Context): Context {
  assertSupportedPluginType(context, 'docs-content');

  const { docsPath } = readJsonFile<{ docsPath?: string }>(context, 'src/plugin.json');
  if (!docsPath) {
    throw new Error(
      'src/plugin.json has no docsPath, so there are no docs pages to write yet.\n  Scaffold them first, commit the result, then run this again:\n  create-plugin add docs'
    );
  }

  if (context.readDir(docsPath).length === 0) {
    throw new Error(
      `src/plugin.json sets docsPath to '${docsPath}', but that folder is missing or empty.\n  Scaffold the pages first, commit the result, then run this again:\n  create-plugin add docs --docsPath ${docsPath}`
    );
  }

  return context;
}
