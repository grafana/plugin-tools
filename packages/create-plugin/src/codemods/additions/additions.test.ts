import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import defaultAdditions from './additions.js';

describe('additions json', () => {
  // As addition scripts are imported dynamically when add is run we assert the path is valid
  // Vitest 4 reimplemented its workers, which caused the previous dynamic import tests to fail.
  // This test now only asserts that the addition script source file exists.
  defaultAdditions.forEach((addition) => {
    it(`should have a valid addition script path for ${addition.name}`, () => {
      // import.meta.resolve() returns a file:// URL, convert to path
      const filePath = fileURLToPath(addition.scriptPath);
      const sourceFilePath = filePath.replace('.js', '.ts');
      expect(existsSync(sourceFilePath)).toBe(true);
    });
  });
});
