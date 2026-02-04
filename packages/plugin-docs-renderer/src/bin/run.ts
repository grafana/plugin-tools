#!/usr/bin/env node
import { access } from 'node:fs/promises';
import minimist from 'minimist';
import { loadDocsFolder } from '../loader.js';
import { parseMarkdown } from '../parser.js';

async function main() {
  const argv = minimist(process.argv.slice(2));
  // get docs path from command line arguments or use default (./docs)
  const docsPath = argv._[0] || './docs';

  // check if the path exists
  try {
    await access(docsPath);
  } catch {
    console.error(`Path not found: ${docsPath}`);
    console.error('Usage: npx @grafana/plugin-docs-renderer [docs-folder]');
    console.error('Example: npx @grafana/plugin-docs-renderer ./docs');
    process.exit(1);
  }

  // load and parse documentation
  try {
    const { manifest, files } = await loadDocsFolder(docsPath);

    // parse each markdown file
    const pages: Record<string, { frontmatter: Record<string, unknown>; html: string }> = {};
    for (const [filePath, content] of Object.entries(files)) {
      const parsed = parseMarkdown(content);
      pages[filePath] = {
        frontmatter: parsed.frontmatter,
        html: parsed.html,
      };
    }

    // output to console
    const result = {
      manifest,
      pages,
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error processing documentation:', error.message);
    } else {
      console.error('Error processing documentation:', error);
    }
    process.exit(1);
  }
}

main();
