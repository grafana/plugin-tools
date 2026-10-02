import { vi } from 'vitest';

import { performPreCodemodChecks } from '../utils.checks.js';
import { isGitDirectoryClean } from '../utils.git.js';
import { getPackageManagerWithFallback } from '../utils.packageManager.js';
import { isPluginDirectory } from '../utils.plugin.js';

vi.mock('../utils.git.js', async (importOriginal) => {
  const original: typeof import('../utils.git.js') = await importOriginal();
  return {
    ...original,
    isGitDirectory: vi.fn().mockResolvedValue(true),
    isGitDirectoryClean: vi.fn().mockResolvedValue(true),
  };
});
vi.mock('../utils.plugin.js', () => ({ isPluginDirectory: vi.fn().mockReturnValue(false) }));
vi.mock('../utils.packageManager.js', () => ({
  getPackageManagerWithFallback: vi.fn(() => ({ packageManagerName: 'npm', packageManagerVersion: '11.12.1' })),
}));
vi.mock('../utils.console.js', () => ({ output: { error: vi.fn(), formatCode: (code: string) => code } }));

const monorepo = { root: '/repo', kind: 'monorepo' as const, plugins: [{ dir: 'plugins/a' }] };

describe('performPreCodemodChecks', () => {
  beforeEach(() => {
    vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code})`);
    }) as typeof process.exit);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('only checks the project paths for uncommitted changes', async () => {
    await performPreCodemodChecks({ _: ['update'] }, monorepo);

    expect(isGitDirectoryClean).toHaveBeenCalledWith({
      cwd: '/repo',
      paths: expect.arrayContaining(['.config', 'package.json', 'plugins/a']),
    });
  });

  it('accepts a monorepo root, which has no src/plugin.json of its own', async () => {
    await expect(performPreCodemodChecks({ _: ['update'] }, monorepo)).resolves.toBeUndefined();
    expect(isPluginDirectory).not.toHaveBeenCalled();
  });

  it('still requires a plugin directory for a single plugin', async () => {
    const single = { root: '/plugin', kind: 'single' as const, plugins: [{ dir: '.' }] };

    await expect(performPreCodemodChecks({ _: ['update'] }, single)).rejects.toThrow('process.exit(1)');
  });

  it('rejects yarn 1 in a monorepo', async () => {
    vi.mocked(getPackageManagerWithFallback).mockReturnValueOnce({
      packageManagerName: 'yarn',
      packageManagerVersion: '1.22.22',
    });

    await expect(performPreCodemodChecks({ _: ['update'], force: true }, monorepo)).rejects.toThrow('process.exit(1)');
  });
});
