import { vi } from 'vitest';

import { getProjectGitPaths, gitCommitNoVerify, isGitDirectoryClean } from '../utils.git.js';

const mocks = vi.hoisted(() => ({
  execFile: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execFile: (
    file: string,
    args: string[],
    options: { cwd?: string },
    callback: (error: Error | null, result: { stdout: string; stderr: string }) => void
  ) => {
    Promise.resolve(mocks.execFile(file, args, options)).then(
      (stdout = '') => callback(null, { stdout, stderr: '' }),
      (error) => callback(error, { stdout: '', stderr: '' })
    );
  },
}));

describe('utils.git', () => {
  beforeEach(() => {
    mocks.execFile.mockReset();
  });

  describe('isGitDirectoryClean', () => {
    it('checks only the given paths, from the given directory', async () => {
      mocks.execFile.mockResolvedValue('');

      await expect(isGitDirectoryClean({ cwd: '/repo', paths: ['.config', 'plugins/a'] })).resolves.toBe(true);
      expect(mocks.execFile).toHaveBeenCalledWith('git', ['status', '--porcelain', '--', '.config', 'plugins/a'], {
        cwd: '/repo',
      });
    });

    it('reports changes in the given paths as dirty', async () => {
      mocks.execFile.mockResolvedValue(' M plugins/a/src/module.ts\n');

      await expect(isGitDirectoryClean({ cwd: '/repo', paths: ['plugins/a'] })).resolves.toBe(false);
    });

    it('treats a failing git command as dirty', async () => {
      mocks.execFile.mockRejectedValue(new Error('not a git repository'));

      await expect(isGitDirectoryClean()).resolves.toBe(false);
    });
  });

  describe('gitCommitNoVerify', () => {
    it('stages and commits only the given paths', async () => {
      await gitCommitNoVerify("chore: run migration\n\nFix the plugin's config", {
        cwd: '/repo',
        paths: ['package.json', '.config/tsconfig.json'],
      });

      expect(mocks.execFile).toHaveBeenNthCalledWith(
        1,
        'git',
        ['add', '-A', '--', 'package.json', '.config/tsconfig.json'],
        { cwd: '/repo' }
      );
      expect(mocks.execFile).toHaveBeenNthCalledWith(
        2,
        'git',
        [
          'commit',
          '--no-verify',
          '-m',
          "chore: run migration\n\nFix the plugin's config",
          '--',
          'package.json',
          '.config/tsconfig.json',
        ],
        { cwd: '/repo' }
      );
    });

    it('stages everything when no paths are given', async () => {
      await gitCommitNoVerify('chore: commit');

      expect(mocks.execFile).toHaveBeenNthCalledWith(1, 'git', ['add', '-A'], { cwd: undefined });
      expect(mocks.execFile).toHaveBeenNthCalledWith(2, 'git', ['commit', '--no-verify', '-m', 'chore: commit'], {
        cwd: undefined,
      });
    });
  });

  describe('getProjectGitPaths', () => {
    it('covers the whole project for a single plugin', () => {
      expect(getProjectGitPaths({ root: '/repo', kind: 'single', plugins: [{ dir: '.' }] })).toEqual(['.']);
    });

    it('covers the shared root files and every plugin in a monorepo', () => {
      const paths = getProjectGitPaths({
        root: '/repo',
        kind: 'monorepo',
        plugins: [{ dir: 'plugins/a' }, { dir: 'plugins/b' }],
      });

      expect(paths).toEqual(expect.arrayContaining(['.config', '.github', 'package.json', 'plugins/a', 'plugins/b']));
      expect(paths).not.toContain('.');
      expect(paths).not.toContain('packages');
    });
  });
});
