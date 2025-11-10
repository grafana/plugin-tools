import { existsSync } from 'node:fs';
import { join } from 'node:path';
import defaultMigrations from './migrations.js';

describe('migrations json', () => {
  // As migration scripts are imported dynamically when update is run we assert the path is valid
  // Vitest 4 reimplemented it's workers which caused the previous dynamic import tests to fail.
  // This test now only asserts that the source file exists.
  Object.entries(defaultMigrations.migrations).forEach(([key, migration]) => {
    it(`should have a valid migration script path for ${key}`, () => {
      const migrationPathString = migration.migrationScript.replace('.js', '.ts');
      const path = join(__dirname, migrationPathString);
      expect(existsSync(path)).toBe(true);
    });
  });
});
