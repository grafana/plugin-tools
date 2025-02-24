import defaultMigrations from './migrations.js';

describe('migrations json', () => {
  // As migration scripts are imported dynamically when update is run we assert the path is valid
  Object.entries(defaultMigrations.migrations).forEach(([key, migration]) => {
    it(`should have a valid migration script path for ${key}`, () => {
      expect(async () => {
        await import(migration.migrationScript);
      }).not.toThrow();
    });
  });
});
