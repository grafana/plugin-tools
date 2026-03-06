import { flushChanges, formatFiles, printChanges } from '../utils.js';
import { getMigrationsToRun, runMigrations } from './manager.js';

import { Context } from '../context.js';
import { Migration } from './migrations.js';
import { gitCommitNoVerify } from '../../utils/utils.git.js';
import migrationFixtures from './fixtures/migrations.js';
import { setRootConfig } from '../../utils/utils.config.js';
import { vi } from 'vitest';

vi.mock('../utils.js', async (importOriginal) => {
  const actual: typeof import('../utils.js') = await importOriginal();
  return {
    ...actual,
    flushChanges: vi.fn(),
    formatFiles: vi.fn(),
    installNPMDependencies: vi.fn(),
    printChanges: vi.fn(),
  };
});

// Silence terminal output during tests.
vi.mock('../../utils/utils.console.js', () => ({
  output: {
    log: vi.fn(),
    addHorizontalLine: vi.fn(),
    logSingleLine: vi.fn(),
    bulletList: vi.fn().mockReturnValue(['']),
  },
}));

vi.mock('../../utils/utils.config.js', () => ({
  setRootConfig: vi.fn(),
}));
vi.mock('../../utils/utils.git.js', () => ({
  gitCommitNoVerify: vi.fn(),
}));

vi.mock('@libs/version', () => ({
  getVersion: vi.fn().mockReturnValue('2.0.0'),
}));

describe('Migrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMigrationsToRun', () => {
    it('should return the migrations that need to be run', () => {
      const fromVersion = '3.0.0';
      const toVersion = '5.0.0';
      const migrations = getMigrationsToRun(fromVersion, toVersion, migrationFixtures);
      expect(migrations).toEqual([
        {
          name: 'migration-key1',
          version: '5.0.0',
          description: 'Update project to use new cache directory',
          scriptPath: './5-0-0-cache-directory.js',
        },
      ]);

      const fromVersion2 = '5.0.0';
      const toVersion2 = '5.5.0';
      const migrations2 = getMigrationsToRun(fromVersion2, toVersion2, migrationFixtures);
      expect(migrations2).toEqual([
        {
          name: 'migration-key1',
          version: '5.0.0',
          description: 'Update project to use new cache directory',
          scriptPath: './5-0-0-cache-directory.js',
        },
        {
          name: 'migration-key2',
          version: '5.4.0',
          description: 'Update project to use new cache directory',
          scriptPath: './5-4-0-cache-directory.js',
        },
      ]);

      const fromVersion3 = '5.5.0';
      const toVersion3 = '6.0.0';
      const migrations3 = getMigrationsToRun(fromVersion3, toVersion3, migrationFixtures);
      expect(migrations3).toEqual([
        {
          name: 'migration-key3',
          version: '6.0.0',
          description: 'Update project to use new cache directory',
          scriptPath: './5-4-0-cache-directory.js',
        },
      ]);
    });

    it('should sort migrations by version', () => {
      const fromVersion = '2.0.0';
      const toVersion = '6.0.0';
      const migrations = getMigrationsToRun(fromVersion, toVersion, [
        {
          name: 'migration-key1',
          version: '5.3.0',
          description: 'Update project to use new cache directory',
          scriptPath: './5.3.0-migration.js',
        },
        {
          name: 'migration-key2',
          version: '2.3.0',
          description: 'Update project to use new cache directory',
          scriptPath: './2.3.0-migration.js',
        },
        {
          name: 'migration-key3',
          version: '2.0.0',
          description: 'Update project to use new cache directory',
          scriptPath: './2.0.0-migration.js',
        },
        {
          name: 'migration-key4',
          version: '2.0.0',
          description: 'Update project to use new cache directory',
          scriptPath: './2.0.0-migration.js',
        },
      ]);

      expect(migrations.map((m) => m.name)).toEqual([
        'migration-key3',
        'migration-key4',
        'migration-key2',
        'migration-key1',
      ]);
    });
  });

  describe('runMigrations', () => {
    const migrationOneFn = vi.fn();
    const migrationTwoFn = vi.fn();
    const consoleMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    vi.doMock('virtual-test-migration.js', async () => ({
      default: migrationOneFn,
    }));
    vi.doMock('virtual-test-migration2.js', async () => ({
      default: migrationTwoFn,
    }));

    const migrations: Migration[] = [
      {
        name: 'migration-one',
        version: '1.0.0',
        description: '...',
        scriptPath: 'virtual-test-migration.js',
      },
      {
        name: 'migration-two',
        version: '1.2.0',
        description: '...',
        scriptPath: 'virtual-test-migration2.js',
      },
    ];

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

      // 2 migration commits + 1 version update commit = 3 total
      expect(gitCommitNoVerify).toHaveBeenCalledTimes(3);
    });

    it('should not create a commit for a migration that has no changes', async () => {
      migrationTwoFn.mockImplementation(async (context: Context) => context);

      await runMigrations(migrations, { commitEachMigration: true });

      // 1 migration commit (only migration-one has changes) + 1 version update commit = 2 total
      expect(gitCommitNoVerify).toHaveBeenCalledTimes(2);
    });

    it('should update version in ".config/.cprc.json" on a successful update', async () => {
      await runMigrations(migrations);

      expect(setRootConfig).toHaveBeenCalledTimes(1);

      // The latest version in the migrations
      // (For `runMigrations()` this means the last key in the object according to `getMigrationsToRun()`)
      expect(setRootConfig).toHaveBeenCalledWith({ version: '2.0.0' });
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
