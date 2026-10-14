import { vi } from 'vitest';
import { getPackageManagerWithFallback } from './utils.packageManager.js';
import { getPackageJson } from './utils.packagejson.js';

vi.mock(import('./utils.packagejson.js'), () => ({
  getPackageJson: vi.fn(),
}));

vi.mock(import('@libs/find-up'), () => ({
  findUpSync: () => undefined,
}));

describe('getPackageManagerWithFallback', () => {
  it('reads the packageManager field', () => {
    vi.mocked(getPackageJson).mockReturnValue({ packageManager: 'pnpm@10.4.1' } as never);
    expect(getPackageManagerWithFallback()).toEqual({ packageManagerName: 'pnpm', packageManagerVersion: '10.4.1' });
  });

  it('ignores a packageManager field without a version', () => {
    vi.mocked(getPackageJson).mockReturnValue({ packageManager: 'yarn' } as never);
    expect(getPackageManagerWithFallback()).toEqual({ packageManagerName: 'npm', packageManagerVersion: '10.9.0' });
  });
});
