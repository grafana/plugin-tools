import { access, cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import createDebug from 'debug';
import { resolveDocsPath } from '../utils/utils.plugin.js';
import { scanDocsFolder } from '../scanner.js';

const debug = createDebug('plugin-docs-cli:build');

/**
 * Builds plugin documentation for publishing.
 *
 * Scans the docs folder, generates a manifest from the filesystem structure
 * and copies everything to dist/ for inclusion in the plugin archive.
 *
 * @param projectRoot - The root directory of the plugin project (defaults to cwd)
 */
export async function build(projectRoot?: string): Promise<void> {
  const root = projectRoot || process.cwd();
  debug('Build command invoked with projectRoot: %s', root);

  // resolve docs path from plugin.json
  const docsPath = await resolveDocsPath(root);

  // validate docs path exists
  try {
    await access(docsPath);
  } catch {
    throw new Error(
      `Docs path not found: ${docsPath}\nCheck that the "docsPath" in src/plugin.json points to an existing directory.`
    );
  }

  // scan docs folder and generate manifest
  const { manifest } = await scanDocsFolder(docsPath);

  // determine output directory: dist/{relative docsPath}/
  const relativeDocsPath = relative(root, docsPath);
  const outputDir = join(root, 'dist', relativeDocsPath);
  debug('Output directory: %s', outputDir);

  // clean and recreate output directory
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  // copy entire docs folder to output (preserves .md files, images and other assets)
  await cp(docsPath, outputDir, { recursive: true });
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
