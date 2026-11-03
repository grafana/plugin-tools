import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, mkdir, writeFile, cp, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildDocs } from './build.command.js';
import { validate } from '../validation/engine.js';
import { allRules } from '../validation/rules/index.js';
import { Rule } from '../validation/types.js';

describe('build', () => {
  let tmpDir: string;
  let docsPath: string;
  const fixturesPath = join(__dirname, '..', '__fixtures__');

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'plugin-docs-build-'));
    docsPath = join(tmpDir, 'docs');

    // copy test-docs fixture as the docs folder
    await cp(join(fixturesPath, 'test-docs'), docsPath, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should generate manifest.json in the output directory', async () => {
    await buildDocs(tmpDir, docsPath);

    const manifestPath = join(tmpDir, 'dist', 'docs', 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));

    expect(manifest.version).toBe('1');
    expect(manifest.pages).toHaveLength(5);
    expect(manifest.pages[0].slug).toBe('index');
    expect(manifest.pages[1].title).toBe('Home Page');
    expect(manifest.pages[1].slug).toBe('home');
  });

  it('should inline frontmatter and content into manifest.json, self-contained', async () => {
    await buildDocs(tmpDir, docsPath);

    const manifestPath = join(tmpDir, 'dist', 'docs', 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));

    const home = manifest.pages.find((p: { slug: string }) => p.slug === 'home');
    expect(home.frontmatter).toEqual({
      title: 'Home Page',
      description: 'Welcome to the test docs',
      sidebar_position: 1,
    });
    expect(home.content).toContain('# Welcome');
    // the built manifest carries everything a reader needs; no separate file read required
    expect(home.content).not.toContain('---');
  });

  it('should copy markdown files preserving directory structure', async () => {
    await buildDocs(tmpDir, docsPath);

    const outputDir = join(tmpDir, 'dist', 'docs');

    // top-level files
    const homeContent = await readFile(join(outputDir, 'home.md'), 'utf-8');
    expect(homeContent).toContain('# Welcome');

    // nested files
    const settingsContent = await readFile(join(outputDir, 'config', 'settings.md'), 'utf-8');
    expect(settingsContent).toContain('# Settings');
  });

  it('should leave meta files such as README.md and AGENTS.md out of the output', async () => {
    for (const file of ['README.md', 'AGENTS.md', 'CLAUDE.md', 'readme.md']) {
      await writeFile(join(docsPath, file), '# Notes for the author\n');
    }
    await mkdir(join(docsPath, 'config'), { recursive: true });
    await writeFile(join(docsPath, 'config', 'CHANGELOG.md'), '# Changes\n');

    await buildDocs(tmpDir, docsPath);

    const outputDir = join(tmpDir, 'dist', 'docs');
    for (const file of ['README.md', 'AGENTS.md', 'CLAUDE.md', 'readme.md', join('config', 'CHANGELOG.md')]) {
      await expect(access(join(outputDir, file)), file).rejects.toThrow();
    }
    await expect(readFile(join(outputDir, 'home.md'), 'utf-8')).resolves.toContain('# Welcome');
  });

  it('should copy non-markdown assets', async () => {
    await buildDocs(tmpDir, docsPath);

    const imgPath = join(tmpDir, 'dist', 'docs', 'img', 'test.png');
    await expect(access(imgPath)).resolves.toBeUndefined();
  });

  it('should copy mp4 and webm videos', async () => {
    await mkdir(join(docsPath, 'video'));
    await writeFile(join(docsPath, 'video', 'demo.mp4'), 'mp4');
    await writeFile(join(docsPath, 'video', 'demo.webm'), 'webm');

    await buildDocs(tmpDir, docsPath);

    const videoDir = join(tmpDir, 'dist', 'docs', 'video');
    await expect(access(join(videoDir, 'demo.mp4'))).resolves.toBeUndefined();
    await expect(access(join(videoDir, 'demo.webm'))).resolves.toBeUndefined();
  });

  it('should clean the output directory before building', async () => {
    const outputDir = join(tmpDir, 'dist', 'docs');

    // create a stale file in the output directory
    await mkdir(outputDir, { recursive: true });
    await writeFile(join(outputDir, 'stale.txt'), 'should be removed');

    await buildDocs(tmpDir, docsPath);

    await expect(access(join(outputDir, 'stale.txt'))).rejects.toThrow();
  });

  it('should include nested pages with children in manifest', async () => {
    await buildDocs(tmpDir, docsPath);

    const manifestPath = join(tmpDir, 'dist', 'docs', 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));

    const configPage = manifest.pages.find((p: { slug: string }) => p.slug === 'config');
    expect(configPage).toBeDefined();
    expect(configPage.children).toHaveLength(2);
    expect(configPage.children[0].slug).toBe('config/settings');
  });

  it('should throw when docs path does not exist', async () => {
    await expect(buildDocs(tmpDir, join(tmpDir, 'nonexistent'))).rejects.toThrow();
  });

  describe('plugin screenshots', () => {
    // the rules that decide whether a page may show a screenshot, and whether the built docs hold together
    const SCREENSHOT_RULES = new Set<string>([
      Rule.NoPathTraversal,
      Rule.ReferencedImagesExist,
      Rule.DistManifestMatchesDocs,
      Rule.DistManifestValid,
    ]);
    const screenshots = () => ({ root: join(tmpDir, 'src'), paths: ['img/screenshots/grid.png'] });

    // the plugin build has already copied the screenshot into dist when the docs build runs
    const addScreenshotPages = async () => {
      await mkdir(join(tmpDir, 'dist', 'img', 'screenshots'), { recursive: true });
      await writeFile(join(tmpDir, 'dist', 'img', 'screenshots', 'grid.png'), 'png');
      await mkdir(join(docsPath, 'options'), { recursive: true });
      await writeFile(
        join(docsPath, 'gallery.md'),
        '---\ntitle: Gallery\ndescription: A page that shows a screenshot\n---\n\n![Grid](../src/img/screenshots/grid.png)\n'
      );
      await writeFile(
        join(docsPath, 'options', 'legend.md'),
        '---\ntitle: Legend\ndescription: A nested page that shows a screenshot\n---\n\n![Grid](../../src/img/screenshots/grid.png)\n'
      );
    };

    it('should point built pages at the screenshot in the built plugin', async () => {
      await addScreenshotPages();

      await buildDocs(tmpDir, docsPath, screenshots());

      const outputDir = join(tmpDir, 'dist', 'docs');
      expect(await readFile(join(outputDir, 'gallery.md'), 'utf-8')).toContain('![Grid](../img/screenshots/grid.png)');
      expect(await readFile(join(outputDir, 'options', 'legend.md'), 'utf-8')).toContain(
        '![Grid](../../img/screenshots/grid.png)'
      );
    });

    it('should leave the pages in the source as they are', async () => {
      await addScreenshotPages();

      await buildDocs(tmpDir, docsPath, screenshots());

      expect(await readFile(join(docsPath, 'gallery.md'), 'utf-8')).toContain('../src/img/screenshots/grid.png');
    });

    it('should write the rewritten text into the manifest', async () => {
      await addScreenshotPages();

      await buildDocs(tmpDir, docsPath, screenshots());

      const manifest = JSON.parse(await readFile(join(tmpDir, 'dist', 'docs', 'manifest.json'), 'utf-8'));
      const gallery = manifest.pages.find((p: { slug: string }) => p.slug === 'gallery');
      expect(gallery.content).toContain('![Grid](../img/screenshots/grid.png)');
      expect(gallery.content).not.toContain('src/img');
    });

    it('should produce docs that pass validation of the built plugin', async () => {
      await addScreenshotPages();

      await buildDocs(tmpDir, docsPath, screenshots());

      const result = await validate(
        {
          docsPath: join(tmpDir, 'dist', 'docs'),
          mode: 'dist',
          screenshots: { root: join(tmpDir, 'dist'), paths: screenshots().paths },
        },
        allRules
      );
      const problems = result.diagnostics.filter((d) => d.severity === 'error' && SCREENSHOT_RULES.has(d.rule));
      expect(problems).toEqual([]);
    });

    it('should pass validation of the source docs', async () => {
      await addScreenshotPages();
      await mkdir(join(tmpDir, 'src', 'img', 'screenshots'), { recursive: true });
      await writeFile(join(tmpDir, 'src', 'img', 'screenshots', 'grid.png'), 'png');

      const result = await validate({ docsPath, screenshots: screenshots() }, allRules);

      expect(result.diagnostics.filter((d) => SCREENSHOT_RULES.has(d.rule))).toEqual([]);
    });

    it('should leave the manifest alone when no page shows a screenshot', async () => {
      await buildDocs(tmpDir, docsPath, screenshots());

      const outputDir = join(tmpDir, 'dist', 'docs');
      const manifest = JSON.parse(await readFile(join(outputDir, 'manifest.json'), 'utf-8'));
      expect(manifest.pages).toHaveLength(5);
    });
  });
});
