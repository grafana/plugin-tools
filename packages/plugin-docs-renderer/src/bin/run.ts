#!/usr/bin/env node
import { access, writeFile } from 'node:fs/promises';
import { loadDocsFolder } from '../loader.js';
import { parseMarkdown } from '../parser.js';

async function main() {
  const docsPath = process.argv[2];

  // find --output flag
  const outputIndex = process.argv.indexOf('--output');
  const outputPath = outputIndex !== -1 ? process.argv[outputIndex + 1] : undefined;

  // check if the first argument is present
  if (docsPath === undefined) {
    console.error('Please provide the path to the docs folder as an argument.');
    process.exit(1);
  }

  // check if --output flag is provided
  if (outputPath === undefined) {
    console.error('Please provide an output file using the --output flag.');
    process.exit(1);
  }

  // check if the path exists
  try {
    await access(docsPath);
  } catch {
    console.error(`Path not found: ${docsPath}`);
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

    // write output to file
    const result = {
      manifest,
      pages,
    };

    await writeFile(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`Documentation rendered successfully to ${outputPath}`);
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
