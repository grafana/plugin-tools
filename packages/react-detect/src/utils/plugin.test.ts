import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Reset module cache between tests since getPluginJson caches internally
beforeEach(async () => {
  const { resetPluginJsonCache } = await import('./plugin.js');
  resetPluginJsonCache();
});

describe('getPluginJson', () => {
  it('reads plugin.json from the given distDir directly without appending /dist', async () => {
    const distDir = mkdtempSync(join(tmpdir(), 'react-detect-plugin-test-'));
    const pluginJson = { id: 'my-plugin', name: 'My Plugin', type: 'app', info: { version: '2.0.0' } };
    writeFileSync(join(distDir, 'plugin.json'), JSON.stringify(pluginJson));

    const { getPluginJson } = await import('./plugin.js');
    const result = getPluginJson(distDir);

    expect(result.id).toBe('my-plugin');
    expect(result.info.version).toBe('2.0.0');
  });

  it('throws when plugin.json does not exist in the given distDir', async () => {
    const distDir = mkdtempSync(join(tmpdir(), 'react-detect-plugin-test-'));

    const { getPluginJson } = await import('./plugin.js');

    expect(() => getPluginJson(distDir)).toThrow('plugin.json');
  });
});
