import { rmSync } from 'node:fs';
import { vi } from 'vitest';
import { getCreatePluginVersion } from './getCreatePluginVersion.js';
import { createTempDir, writeFiles } from './tests/fixtures.js';

describe('getCreatePluginVersion', () => {
  const tempDirs: string[] = [];

  function mockCwd(files: Record<string, string> = {}) {
    const dir = createTempDir();
    tempDirs.push(dir);
    writeFiles(dir, files);
    vi.spyOn(process, 'cwd').mockReturnValue(dir);
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    tempDirs.forEach((dir) => rmSync(dir, { recursive: true, force: true }));
  });

  it('should return the version from .config/.cprc.json', () => {
    mockCwd({ '.config/.cprc.json': JSON.stringify({ version: '5.0.0' }) });

    expect(getCreatePluginVersion()).toBe('5.0.0');
  });

  it('should return null when .config/.cprc.json does not exist', () => {
    mockCwd();

    expect(getCreatePluginVersion()).toBeNull();
  });

  it('should return null when .config/.cprc.json is malformed', () => {
    mockCwd({ '.config/.cprc.json': 'not-valid-json' });

    expect(getCreatePluginVersion()).toBeNull();
  });
});
