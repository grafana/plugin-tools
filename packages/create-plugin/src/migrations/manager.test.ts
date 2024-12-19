import path from 'node:path';
import { getAllMigrations, getMigrationsToRun } from './manager.js';

describe('Migrations', () => {
  describe('getAllMigrations', () => {
    it('should return all migrations metadata from the migrations.json', () => {
      const migrationsJsonPath = path.join(__dirname, 'fixtures', 'migrations.json');
      const migrations = getAllMigrations(migrationsJsonPath);
      expect(migrations).toEqual({
        'migration-key1': {
          version: '5.0.0',
          description: 'Update project to use new cache directory',
          migrationScript: './5-0-0-cache-directory.js',
        },
        'migration-key2': {
          version: '5.4.0',
          description: 'Update project to use new cache directory',
          migrationScript: './5-4-0-cache-directory.js',
        },
        'migration-key3': {
          version: '6.0.0',
          description: 'Update project to use new cache directory',
          migrationScript: './5-4-0-cache-directory.js',
        },
      });
    });
  });

  describe('getMigrationsToRun', () => {
    it('should return the migrations that need to be run', () => {
      const migrationsJsonPath = path.join(__dirname, 'fixtures', 'migrations.json');
      const fromVersion = '3.0.0';
      const toVersion = '5.0.0';
      const migrations = getMigrationsToRun(fromVersion, toVersion, migrationsJsonPath);
      expect(migrations).toEqual({
        'migration-key1': {
          version: '5.0.0',
          description: 'Update project to use new cache directory',
          migrationScript: './5-0-0-cache-directory.js',
        },
      });

      const fromVersion2 = '5.0.0';
      const toVersion2 = '5.5.0';
      const migrations2 = getMigrationsToRun(fromVersion2, toVersion2, migrationsJsonPath);
      expect(migrations2).toEqual({
        'migration-key1': {
          version: '5.0.0',
          description: 'Update project to use new cache directory',
          migrationScript: './5-0-0-cache-directory.js',
        },
        'migration-key2': {
          version: '5.4.0',
          description: 'Update project to use new cache directory',
          migrationScript: './5-4-0-cache-directory.js',
        },
      });

      const fromVersion3 = '5.5.0';
      const toVersion3 = '6.0.0';
      const migrations3 = getMigrationsToRun(fromVersion3, toVersion3, migrationsJsonPath);
      expect(migrations3).toEqual({
        'migration-key3': {
          version: '6.0.0',
          description: 'Update project to use new cache directory',
          migrationScript: './5-4-0-cache-directory.js',
        },
      });
    });
  });
});
