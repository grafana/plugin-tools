import type { Context } from '../../context.js';
import { readJsonFile } from '../../utils.js';
import { assertSupportedPluginType, assertValidDocsPath, hasDocsPages } from './docs.js';

// the agent step does the writing. this only stops it from starting on a plugin with no docs pages to fill
export default function docsContent(context: Context): Context {
  assertSupportedPluginType(context, 'docs-content');

  const { docsPath } = readJsonFile<{ docsPath?: unknown }>(context, 'src/plugin.json');
  if (docsPath === undefined) {
    throw new Error(
      'src/plugin.json has no docsPath, so there are no docs pages to write yet.\n  Scaffold them first, commit the result, then run this again:\n  create-plugin add docs'
    );
  }

  assertValidDocsPath(docsPath, 'add docs-content', 'run create-plugin add docs to scaffold the pages there');

  if (!hasDocsPages(context, docsPath)) {
    throw new Error(
      `src/plugin.json sets docsPath to '${docsPath}', but that folder has no docs pages.\n  Scaffold the pages first, commit the result, then run this again:\n  create-plugin add docs --docsPath ${docsPath}`
    );
  }

  // the prompt relies on its page-to-source table, and re-running add docs adds it without touching pages
  if (!context.doesFileExist(`${docsPath}/AGENTS.md`)) {
    throw new Error(
      `${docsPath}/AGENTS.md is missing, and the agent needs it to know which source each page documents.\n  Add it, commit the result, then run this again:\n  create-plugin add docs --docsPath ${docsPath}`
    );
  }

  return context;
}
