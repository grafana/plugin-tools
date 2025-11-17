import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import defaultMigrations from './migrations.js';

describe('migrations json', () => {
  // As migration scripts are imported dynamically when update is run we assert the path is valid
  // Vitest 4 reimplemented its workers, which caused the previous dynamic import tests to fail.
  // This test now only asserts that the migration script source file exists.
  defaultMigrations.forEach((migration) => {
    it(`should have a valid migration script path for ${migration.name}`, () => {
      // import.meta.resolve() returns a file:// URL, convert to path
      const filePath = fileURLToPath(migration.scriptPath);
      const sourceFilePath = filePath.replace('.js', '.ts');
      expect(existsSync(sourceFilePath)).toBe(true);
    });
  });
});
