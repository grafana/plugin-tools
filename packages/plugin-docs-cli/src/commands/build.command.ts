import { access, cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import createDebug from 'debug';
import { resolveDocsPath } from '../utils/utils.plugin.js';
import { scanDocsFolder } from '../scanner.js';

const debug = createDebug('plugin-docs-cli:build');

/**
 * Core build logic. Exported for testing.
 *
 * @param projectRoot - The root directory of the plugin project
 */
export async function buildDocs(projectRoot: string): Promise<void> {
  debug('Build invoked with projectRoot: %s', projectRoot);

  // resolve docs path from plugin.json
  const docsPath = await resolveDocsPath(projectRoot);

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
  const relativeDocsPath = relative(projectRoot, docsPath);
  const outputDir = join(projectRoot, 'dist', relativeDocsPath);
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

/**
 * CLI entry point for the build command.
 * Handles errors and exits with appropriate codes.
 */
export async function build(): Promise<void> {
  try {
    await buildDocs(process.cwd());
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}
