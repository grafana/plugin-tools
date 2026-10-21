import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveBuiltPluginJson, resolvePluginJson } from './utils.plugin.js';

describe('resolvePluginJson', () => {
  const fixturesPath = join(__dirname, '..', '__fixtures__');

  it('should resolve docsPath, pluginType and snippetValues from plugin.json', async () => {
    const projectRoot = join(fixturesPath, 'test-plugin');
    const result = await resolvePluginJson(projectRoot);

    expect(result).toEqual({
      docsPath: join(projectRoot, 'docs'),
      docsPathSetting: 'docs',
      pluginType: 'datasource',
      snippetValues: { pluginName: 'Test Plugin', pluginId: 'test-plugin' },
    });
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

describe('resolveBuiltPluginJson', () => {
  const writePlugin = async (pluginJson: unknown) => {
    const root = await mkdtemp(join(tmpdir(), 'built-plugin-'));
    await writeFile(join(root, 'plugin.json'), JSON.stringify(pluginJson));
    return root;
  };

  it('should resolve docsPath and pluginType from plugin.json at the root', async () => {
    const root = await writePlugin({ docsPath: 'docs', type: 'panel' });

    expect(await resolveBuiltPluginJson(root)).toEqual({
      docsPath: join(root, 'docs'),
      docsPathSetting: 'docs',
      pluginType: 'panel',
    });
  });

  it('should throw with a build hint when plugin.json is missing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'built-plugin-'));

    await expect(resolveBuiltPluginJson(root)).rejects.toThrow('Build the plugin and run the docs build first');
  });

  it('should throw when docsPath is not set', async () => {
    const root = await writePlugin({ type: 'panel' });

    await expect(resolveBuiltPluginJson(root)).rejects.toThrow('"docsPath" is not set in plugin.json');
  });

  // GCOM looks up the literal path in the archive, so anything that is not a plain folder is not found there
  it.each(['../docs', '.', './docs', 'docs/../docs', 'docs/./x', 'a//b', 'docs/..', '..', 'docs\\guide'])(
    'should throw when docsPath %s is not a plain folder',
    async (docsPath) => {
      const root = await writePlugin({ docsPath });

      await expect(resolveBuiltPluginJson(root)).rejects.toThrow('must be a plain folder');
    }
  );

  it.each([
    ['/docs', 'docs'],
    ['docs/', 'docs'],
    ['/docs/', 'docs'],
    ['..docs', '..docs'],
    ['catalog/docs', join('catalog', 'docs')],
  ])('should resolve docsPath %s the way GCOM does', async (docsPath, folder) => {
    const root = await writePlugin({ docsPath });

    expect((await resolveBuiltPluginJson(root)).docsPath).toBe(join(root, folder));
  });
});
