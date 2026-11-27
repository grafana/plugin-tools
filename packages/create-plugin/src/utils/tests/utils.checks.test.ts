import { vi } from 'vitest';

import { performPreCodemodChecks } from '../utils.checks.js';
import { isGitDirectoryClean } from '../utils.git.js';

vi.mock('../utils.git.js', async (importOriginal) => {
  const original: typeof import('../utils.git.js') = await importOriginal();
  return {
    ...original,
    isGitDirectory: vi.fn().mockResolvedValue(true),
    isGitDirectoryClean: vi.fn().mockResolvedValue(true),
  };
});
vi.mock('../utils.plugin.js', () => ({ isPluginDirectory: vi.fn().mockReturnValue(true) }));

describe('performPreCodemodChecks', () => {
  it('only checks the project paths for uncommitted changes', async () => {
    const project = { root: '/repo', kind: 'monorepo' as const, plugins: [{ dir: 'plugins/a' }] };

    await performPreCodemodChecks({ _: ['update'] }, project);

    expect(isGitDirectoryClean).toHaveBeenCalledWith({
      cwd: '/repo',
      paths: expect.arrayContaining(['.config', 'package.json', 'plugins/a']),
    });
  });
});
