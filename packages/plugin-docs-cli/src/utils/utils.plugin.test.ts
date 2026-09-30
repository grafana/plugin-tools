import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { resolvePluginJson } from './utils.plugin.js';

describe('resolvePluginJson', () => {
  const fixturesPath = join(__dirname, '..', '__fixtures__');

  it('should resolve docsPath and pluginType from plugin.json', async () => {
    const projectRoot = join(fixturesPath, 'test-plugin');
    const result = await resolvePluginJson(projectRoot);

    expect(result).toEqual({ docsPath: join(projectRoot, 'docs'), pluginType: 'datasource' });
  });

  it('should throw when src/plugin.json is missing', async () => {
    const projectRoot = join(fixturesPath, 'non-existent');

    await expect(resolvePluginJson(projectRoot)).rejects.toThrow('Could not find src/plugin.json');
  });

  it('should throw when docsPath is not set in plugin.json', async () => {
    const projectRoot = join(fixturesPath, 'no-docspath-plugin');

    await expect(resolvePluginJson(projectRoot)).rejects.toThrow('"docsPath" is not set in src/plugin.json');
  });
});
