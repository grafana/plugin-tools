import { join } from 'node:path';
import type { Context } from '../../context.js';
import { additionsDebug, readJsonFile } from '../../utils.js';
import { assertSupportedPluginType, assertValidDocsPath, hasDocsPages } from './docs.js';

const COPY_FILES_PATH = join('.config', 'bundler', 'copyFiles.ts');
const CONSTANTS_PATH = join('.config', 'bundler', 'constants.ts');

const OLD_IMPORT = "import { getPluginJson, hasReadme } from './utils.ts';\n";
const NEW_IMPORT = `import fs from 'fs';
import path from 'path';
import { SOURCE_DIR } from './constants.ts';
${OLD_IMPORT}`;

const OLD_SCREENSHOT_PATHS =
  'const screenshotPaths: string[] = pluginJson.info?.screenshots?.map((s: { path: string }) => s.path) || [];\n';
const NEW_SCREENSHOT_PATHS = `${OLD_SCREENSHOT_PATHS}
// a screenshot outside src, such as one in the docs folder, resolves from the project root
function resolveScreenshotSource(screenshotPath: string) {
  const root = process.cwd();
  const isOutsideSource =
    !fs.existsSync(path.resolve(root, SOURCE_DIR, screenshotPath)) && fs.existsSync(path.resolve(root, screenshotPath));
  return isOutsideSource ? path.resolve(root, screenshotPath) : screenshotPath;
}
`;

const OLD_SCREENSHOT_FROM = '    from: screenshotPath,\n';
const NEW_SCREENSHOT_FROM = '    from: resolveScreenshotSource(screenshotPath),\n';

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

  // the agent may point info.screenshots into the docs folder, which an older copyFiles.ts only looks for under src
  allowScreenshotsOutsideSource(context);

  return context;
}

/** Updates an unmodified `.config/bundler/copyFiles.ts` to match the current template, and leaves any other alone. */
export function allowScreenshotsOutsideSource(context: Context): void {
  const content = context.getFile(COPY_FILES_PATH);
  if (content === undefined || content.includes('resolveScreenshotSource')) {
    return;
  }
  if (!context.doesFileExist(CONSTANTS_PATH)) {
    additionsDebug(`${CONSTANTS_PATH} not found, leaving ${COPY_FILES_PATH} as is`);
    return;
  }
  if (![OLD_IMPORT, OLD_SCREENSHOT_PATHS, OLD_SCREENSHOT_FROM].every((part) => content.includes(part))) {
    additionsDebug(`${COPY_FILES_PATH} has been customised, leaving it as is`);
    return;
  }
  context.updateFile(
    COPY_FILES_PATH,
    content
      .replace(OLD_IMPORT, NEW_IMPORT)
      .replace(OLD_SCREENSHOT_PATHS, NEW_SCREENSHOT_PATHS)
      .replace(OLD_SCREENSHOT_FROM, NEW_SCREENSHOT_FROM)
  );
}
