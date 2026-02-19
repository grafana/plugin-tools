import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { resolveDocsPath } from './utils.plugin.js';

describe('resolveDocsPath', () => {
  const fixturesPath = join(__dirname, '..', '__fixtures__');

  it('should resolve docsPath from plugin.json', async () => {
    const projectRoot = join(fixturesPath, 'test-plugin');
    const result = await resolveDocsPath(projectRoot);

    expect(result).toBe(join(projectRoot, 'docs'));
  });

  it('should throw when src/plugin.json is missing', async () => {
    const projectRoot = join(fixturesPath, 'non-existent');

    await expect(resolveDocsPath(projectRoot)).rejects.toThrow('Could not find src/plugin.json');
  });

  it('should throw when docsPath is not set in plugin.json', async () => {
    const projectRoot = join(fixturesPath, 'no-docspath-plugin');

    await expect(resolveDocsPath(projectRoot)).rejects.toThrow('"docsPath" is not set in src/plugin.json');
  });
});
