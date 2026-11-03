import { cp, lstat, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import createDebug from 'debug';
import { scanDocsFolder } from '../scanner.js';
import { rewriteScreenshotRefs } from '../utils/utils.screenshots.js';
import { ALLOWED_EXTENSIONS } from '../validation/rules/filesystem.js';
import { isMetaFile } from '../validation/rules/utils.js';
import type { PluginScreenshots } from '../validation/types.js';

const debug = createDebug('plugin-docs-cli:build');

/**
 * Core build logic.
 *
 * @param projectRoot - The root directory of the plugin project
 * @param docsPath - Resolved absolute path to the docs directory
 * @param screenshots - The plugin's screenshots. Pages that show one from the plugin's `src` folder are
 *   rewritten to show it from the built plugin
 */
export async function buildDocs(projectRoot: string, docsPath: string, screenshots?: PluginScreenshots): Promise<void> {
  debug('Build invoked with projectRoot: %s, docsPath: %s', projectRoot, docsPath);

  // determine output directory: dist/{relative docsPath}/
  const relativeDocsPath = relative(projectRoot, docsPath);
  const builtRoot = join(projectRoot, 'dist');
  const outputDir = join(builtRoot, relativeDocsPath);
  debug('Output directory: %s', outputDir);

  // clean and recreate output directory
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  // copy only allowed file types (mirrors the allowed-file-types rule), and leave out the meta files the manifest skips
  await cp(docsPath, outputDir, {
    recursive: true,
    filter: async (src) => {
      const stat = await lstat(src);
      if (stat.isDirectory()) {
        return true;
      }
      return ALLOWED_EXTENSIONS.has(extname(src).toLowerCase()) && !isMetaFile(src);
    },
  });
  debug('Copied docs folder to %s', outputDir);

  if (screenshots) {
    await rewriteScreenshotRefsInPages({ docsPath, outputDir, builtRoot, screenshots });
  }

  // the manifest holds the text of every page, so it is made from the pages as they ship
  const { manifest } = await scanDocsFolder(outputDir);

  // write generated manifest
  const manifestPath = join(outputDir, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  debug('Wrote manifest to %s', manifestPath);

  // count pages recursively
  const countPages = (pages: typeof manifest.pages): number =>
    pages.reduce((sum, page) => sum + 1 + (page.children ? countPages(page.children) : 0), 0);

  console.log(`\n📦 Documentation built successfully`);
  console.log(`✓ Pages: ${countPages(manifest.pages)}`);
  console.log(`✓ Output: ${outputDir}\n`);
}

/**
 * Points the screenshots that built pages show from `src` at the same files in the built plugin.
 */
async function rewriteScreenshotRefsInPages(options: {
  docsPath: string;
  outputDir: string;
  builtRoot: string;
  screenshots: PluginScreenshots;
}): Promise<void> {
  const { docsPath, outputDir, builtRoot, screenshots } = options;
  const entries = await readdir(outputDir, { recursive: true, withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      continue;
    }
    const builtPage = join(entry.parentPath, entry.name);
    const pageRelPath = relative(outputDir, builtPage).split(sep).join('/');
    const content = await readFile(builtPage, 'utf-8');
    const rewritten = rewriteScreenshotRefs(content, pageRelPath, {
      docsPath,
      builtDocsPath: outputDir,
      builtRoot,
      screenshots,
    });
    if (rewritten !== content) {
      await writeFile(builtPage, rewritten);
      debug('Rewrote screenshot references in %s', pageRelPath);
    }
  }
}
