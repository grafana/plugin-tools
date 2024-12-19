import path from 'node:path';
import { getAllMigrations, getMigrationsToRun, getCpVersion } from './manager.js';

describe('Migrations', () => {
  describe('getAllMigrations', () => {
    it('should return all migrations metadata from the migrations.json', () => {
      const migrationsJsonPath = path.join(__dirname, 'fixtures', 'migrations.json');
      const migrations = getAllMigrations(migrationsJsonPath);
      expect(migrations).toEqual({
        'migration-key': {
          version: '5.4.0',
          description: 'Update project to use new cache directory',
          migrationScript: './5-4-0-cache-directory.js',
        },
      });
    });
  });
});
