import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, mkdir, writeFile, cp, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildDocs } from './build.command.js';

describe('build', () => {
  let tmpDir: string;
  const fixturesPath = join(__dirname, '..', '__fixtures__');

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'plugin-docs-build-'));

    // set up src/plugin.json
    await mkdir(join(tmpDir, 'src'), { recursive: true });
    await writeFile(
      join(tmpDir, 'src', 'plugin.json'),
      JSON.stringify({ type: 'datasource', name: 'Test Plugin', id: 'test-plugin', docsPath: 'docs' })
    );

    // copy test-docs fixture as the docs folder
    await cp(join(fixturesPath, 'test-docs'), join(tmpDir, 'docs'), { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should generate manifest.json in the output directory', async () => {
    await buildDocs(tmpDir);

    const manifestPath = join(tmpDir, 'dist', 'docs', 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));

    expect(manifest.version).toBe('1');
    expect(manifest.pages).toHaveLength(4);
    expect(manifest.pages[0].title).toBe('Home Page');
    expect(manifest.pages[0].slug).toBe('home');
  });

  it('should copy markdown files preserving directory structure', async () => {
    await buildDocs(tmpDir);

    const outputDir = join(tmpDir, 'dist', 'docs');

    // top-level files
    const homeContent = await readFile(join(outputDir, 'home.md'), 'utf-8');
    expect(homeContent).toContain('# Welcome');

    // nested files
    const settingsContent = await readFile(join(outputDir, 'config', 'settings.md'), 'utf-8');
    expect(settingsContent).toContain('# Settings');
  });

  it('should copy non-markdown assets', async () => {
    await buildDocs(tmpDir);

    const imgPath = join(tmpDir, 'dist', 'docs', 'img', 'test.png');
    await expect(access(imgPath)).resolves.toBeUndefined();
  });

  it('should clean the output directory before building', async () => {
    const outputDir = join(tmpDir, 'dist', 'docs');

    // create a stale file in the output directory
    await mkdir(outputDir, { recursive: true });
    await writeFile(join(outputDir, 'stale.txt'), 'should be removed');

    await buildDocs(tmpDir);

    await expect(access(join(outputDir, 'stale.txt'))).rejects.toThrow();
  });

  it('should include nested pages with children in manifest', async () => {
    await buildDocs(tmpDir);

    const manifestPath = join(tmpDir, 'dist', 'docs', 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));

    const configPage = manifest.pages.find((p: { slug: string }) => p.slug === 'config');
    expect(configPage).toBeDefined();
    expect(configPage.children).toHaveLength(2);
    expect(configPage.children[0].slug).toBe('config/settings');
  });

  it('should throw when docs path does not exist', async () => {
    // point to a non-existent docs folder
    await writeFile(join(tmpDir, 'src', 'plugin.json'), JSON.stringify({ docsPath: 'nonexistent' }));

    await expect(buildDocs(tmpDir)).rejects.toThrow('Docs path not found');
  });

  it('should throw when plugin.json is missing', async () => {
    await rm(join(tmpDir, 'src', 'plugin.json'));

    await expect(buildDocs(tmpDir)).rejects.toThrow('Could not find src/plugin.json');
  });
});
