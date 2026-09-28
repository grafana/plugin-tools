// Removes release-please `x-release-please-version` annotations from migration version lines once
// release-please has written the release version into them. Left in place, release-please would re-stamp
// those migrations with the next release version and they would run again for every plugin.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const UNRELEASED = '0.0.0-unreleased';
const ANNOTATION = /\s*\/\/\s*x-release-please-version\s*$/;
const VERSION_LINE = /^\s*version:/;

export function strip(source) {
  let strippedCount = 0;

  const lines = source.split('\n').map((line) => {
    if (!VERSION_LINE.test(line) || !ANNOTATION.test(line)) {
      return line;
    }

    // Still unreleased: create-plugin is not part of this release, so a later one has to freeze it.
    if (line.includes(UNRELEASED)) {
      return line;
    }

    strippedCount += 1;
    return line.replace(ANNOTATION, '');
  });

  return { source: lines.join('\n'), strippedCount };
}

// CLI: node strip.mjs <file> - strips the file in place and prints the number of annotations removed.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , filePath] = process.argv;

  if (!filePath) {
    console.error('Usage: node strip.mjs <file>');
    process.exit(1);
  }

  const result = strip(readFileSync(filePath, 'utf-8'));
  writeFileSync(filePath, result.source);
  console.log(result.strippedCount);
}
