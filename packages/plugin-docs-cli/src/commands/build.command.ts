import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import createDebug from 'debug';
import { scanDocsFolder } from '../scanner.js';
import { ALLOWED_EXTENSIONS } from '../validation/rules/filesystem.js';

const debug = createDebug('plugin-docs-cli:build');

/**
 * Core build logic.
 *
 * @param projectRoot - The root directory of the plugin project
 * @param docsPath - Resolved absolute path to the docs directory
 */
export async function buildDocs(projectRoot: string, docsPath: string): Promise<void> {
  debug('Build invoked with projectRoot: %s, docsPath: %s', projectRoot, docsPath);

  // scan docs folder and generate manifest
  const { manifest } = await scanDocsFolder(docsPath);

  // determine output directory: dist/{relative docsPath}/
  const relativeDocsPath = relative(projectRoot, docsPath);
  const outputDir = join(projectRoot, 'dist', relativeDocsPath);
  debug('Output directory: %s', outputDir);

  // clean and recreate output directory
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  // copy only allowed file types to output (mirrors the allowed-file-types validation rule)
  await cp(docsPath, outputDir, {
    recursive: true,
    filter: (src) => {
      const ext = extname(src).toLowerCase();
      return ext === '' || ALLOWED_EXTENSIONS.has(ext);
    },
  });
  debug('Copied docs folder to %s', outputDir);

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
