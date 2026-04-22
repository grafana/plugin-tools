import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getPluginJson, hasExternalisedJsxRuntime } from './plugin.js';

describe('getPluginJson', () => {
  it('reads plugin.json from the given distDir directly without appending /dist', () => {
    const distDir = mkdtempSync(join(tmpdir(), 'react-detect-plugin-test-'));
    const pluginJson = { id: 'my-plugin', name: 'My Plugin', type: 'app', info: { version: '2.0.0' } };
    writeFileSync(join(distDir, 'plugin.json'), JSON.stringify(pluginJson));

    const result = getPluginJson(distDir);

    expect(result?.id).toBe('my-plugin');
    expect(result?.info.version).toBe('2.0.0');
  });

  it('returns correct data for each distDir when called with different directories', () => {
    const distDir1 = mkdtempSync(join(tmpdir(), 'react-detect-plugin-test-'));
    writeFileSync(
      join(distDir1, 'plugin.json'),
      JSON.stringify({ id: 'plugin-1', name: 'P1', type: 'app', info: { version: '1.0.0' } })
    );
    const distDir2 = mkdtempSync(join(tmpdir(), 'react-detect-plugin-test-'));
    writeFileSync(
      join(distDir2, 'plugin.json'),
      JSON.stringify({ id: 'plugin-2', name: 'P2', type: 'panel', info: { version: '2.0.0' } })
    );

    const result1 = getPluginJson(distDir1);
    const result2 = getPluginJson(distDir2);

    expect(result1?.id).toBe('plugin-1');
    expect(result2?.id).toBe('plugin-2');
  });

  it('throws when plugin.json does not exist in the given distDir', () => {
    const distDir = mkdtempSync(join(tmpdir(), 'react-detect-plugin-test-'));

    expect(() => getPluginJson(distDir)).toThrow('plugin.json');
  });
});

describe('hasExternalisedJsxRuntime', () => {
  it('detects react/jsx-runtime in webpack externals using the given pluginRoot', () => {
    const pluginRoot = mkdtempSync(join(tmpdir(), 'react-detect-plugin-test-'));
    writeFileSync(join(pluginRoot, 'webpack.config.ts'), `module.exports = { externals: ['react/jsx-runtime'] };`);

    expect(hasExternalisedJsxRuntime(pluginRoot)).toBe(true);
  });

  it('returns false when the given pluginRoot has no matching webpack config', () => {
    const pluginRoot = mkdtempSync(join(tmpdir(), 'react-detect-plugin-test-'));

    expect(hasExternalisedJsxRuntime(pluginRoot)).toBe(false);
  });

  it('detects react/jsx-runtime in bundler externals using the given pluginRoot', () => {
    const pluginRoot = mkdtempSync(join(tmpdir(), 'react-detect-plugin-test-'));
    mkdirSync(join(pluginRoot, '.config', 'bundler'), { recursive: true });
    writeFileSync(join(pluginRoot, '.config', 'bundler', 'externals.ts'), `const externals = ['react/jsx-runtime'];`);

    expect(hasExternalisedJsxRuntime(pluginRoot)).toBe(true);
  });
});
