import { vi } from 'vitest';
import { getMigrationsToRun, runMigration, runMigrations } from './manager.js';
import migrationFixtures from './fixtures/migrations.js';
import { Context } from './context.js';
import { gitCommitNoVerify } from '../utils/utils.git.js';
import { flushChanges, printChanges, formatFiles } from './utils.js';
import { setRootConfig } from '../utils/utils.config.js';
import { MigrationMeta } from './migrations.js';

vi.mock('./utils.js', () => ({
  flushChanges: vi.fn(),
  printChanges: vi.fn(),
  migrationsDebug: vi.fn(),
  formatFiles: vi.fn(),
  installNPMDependencies: vi.fn(),
}));

vi.mock('../utils/utils.config.js', () => ({
  setRootConfig: vi.fn(),
}));
vi.mock('../utils/utils.git.js', () => ({
  gitCommitNoVerify: vi.fn(),
}));

describe('Migrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMigrationsToRun', () => {
    it('should return the migrations that need to be run', () => {
      const fromVersion = '3.0.0';
      const toVersion = '5.0.0';
      const migrations = getMigrationsToRun(fromVersion, toVersion, migrationFixtures.migrations);
      expect(migrations).toEqual({
        'migration-key1': {
          version: '5.0.0',
          description: 'Update project to use new cache directory',
          migrationScript: './5-0-0-cache-directory.js',
        },
      });

      const fromVersion2 = '5.0.0';
      const toVersion2 = '5.5.0';
      const migrations2 = getMigrationsToRun(fromVersion2, toVersion2, migrationFixtures.migrations);
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
      const migrations3 = getMigrationsToRun(fromVersion3, toVersion3, migrationFixtures.migrations);
      expect(migrations3).toEqual({
        'migration-key3': {
          version: '6.0.0',
          description: 'Update project to use new cache directory',
          migrationScript: './5-4-0-cache-directory.js',
        },
      });
    });

    it('should sort migrations by version', () => {
      const fromVersion = '2.0.0';
      const toVersion = '6.0.0';
      const migrations = getMigrationsToRun(fromVersion, toVersion, {
        'migration-key1': {
          version: '5.3.0',
          description: 'Update project to use new cache directory',
          migrationScript: './5.3.0-migration.js',
        },
        'migration-key2': {
          version: '2.3.0',
          description: 'Update project to use new cache directory',
          migrationScript: './2.3.0-migration.js',
        },
        'migration-key3': {
          version: '2.0.0',
          description: 'Update project to use new cache directory',
          migrationScript: './2.0.0-migration.js',
        },
        'migration-key4': {
          version: '2.0.0',
          description: 'Update project to use new cache directory',
          migrationScript: './2.0.0-migration.js',
        },
      });

      expect(Object.keys(migrations)).toEqual(['migration-key3', 'migration-key4', 'migration-key2', 'migration-key1']);
    });
  });

  describe('runMigration', () => {
    it('should pass a context to the migration script', async () => {
      const mockContext = new Context('/virtual');
      const migrationFn = vi.fn().mockResolvedValue(mockContext);

      vi.doMock('./test-migration.js', () => ({
        default: migrationFn,
      }));

      const migration: MigrationMeta = {
        version: '1.0.0',
        description: 'test migration',
        migrationScript: './test-migration.js',
      };

      const result = await runMigration(migration, mockContext);

      expect(migrationFn).toHaveBeenCalledWith(mockContext);
      expect(result).toBe(mockContext);
    });
  });

  describe('runMigrations', () => {
    const migrationOneFn = vi.fn();
    const migrationTwoFn = vi.fn();
    const consoleMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    vi.doMock('./migration-one.js', () => ({
      default: migrationOneFn,
    }));
    vi.doMock('./migration-two.js', () => ({
      default: migrationTwoFn,
    }));

    const migrations: Record<string, MigrationMeta> = {
      'migration-one': {
        version: '1.0.0',
        description: '...',
        migrationScript: './migration-one.js',
      },
      'migration-two': {
        version: '1.2.0',
        description: '...',
        migrationScript: './migration-two.js',
      },
    };

    beforeEach(() => {
      migrationOneFn.mockImplementation(async (context: Context) => {
        await context.addFile('one.ts', '');

        return context;
      });
      migrationTwoFn.mockImplementation(async (context: Context) => {
        await context.addFile('two.ts', '');

        return context;
      });
    });

    afterAll(() => {
      consoleMock.mockReset();
    });

    it('should flush the changes for each migration', async () => {
      await runMigrations(migrations);

      expect(flushChanges).toHaveBeenCalledTimes(2);
    });

    it('should print the changes for each migration', async () => {
      await runMigrations(migrations);

      expect(printChanges).toHaveBeenCalledTimes(2);
    });

    it('should format the files for each migration', async () => {
      await runMigrations(migrations);

      expect(formatFiles).toHaveBeenCalledTimes(2);
    });

    it('should not commit the changes for each migration by default', async () => {
      await runMigrations(migrations);

      expect(gitCommitNoVerify).toHaveBeenCalledTimes(0);
    });

    it('should commit the changes for each migration if the CLI arg is present', async () => {
      await runMigrations(migrations, { commitEachMigration: true });

      expect(gitCommitNoVerify).toHaveBeenCalledTimes(2);
    });

    it('should not create a commit for a migration that has no changes', async () => {
      migrationTwoFn.mockImplementation(async (context: Context) => context);

      await runMigrations(migrations, { commitEachMigration: true });

      expect(gitCommitNoVerify).toHaveBeenCalledTimes(1);
    });

    it('should update version in ".config/.cprc.json" on a successful update', async () => {
      await runMigrations(migrations);

      expect(setRootConfig).toHaveBeenCalledTimes(1);

      // The latest version in the migrations
      // (For `runMigrations()` this means the last key in the object according to `getMigrationsToRun()`)
      expect(setRootConfig).toHaveBeenCalledWith({ version: '1.2.0' });
    });

    it('should NOT update version in ".config/.cprc.json" if any of the migrations fail', async () => {
      migrationTwoFn.mockImplementation(async () => {
        throw new Error('Unknown error.');
      });

      await expect(async () => {
        await runMigrations(migrations);
      }).rejects.toThrow();

      expect(setRootConfig).not.toHaveBeenCalled();
    });
  });
});
