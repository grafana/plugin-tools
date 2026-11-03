import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { isInside, resolveScreenshotRef, rewriteScreenshotRefs, type BuiltDocs } from './utils.screenshots.js';

const screenshots = { root: resolve('/repo/src'), paths: ['img/screenshots/grid.png', 'img/logo.svg'] };
const docsPath = resolve('/repo/catalog-docs');
const grid = resolve('/repo/src/img/screenshots/grid.png');

describe('resolveScreenshotRef', () => {
  it('should match a screenshot that a root page shows from src', () => {
    expect(resolveScreenshotRef('../src/img/screenshots/grid.png', 'index.md', docsPath, screenshots)).toBe(grid);
  });

  it('should match from a nested page', () => {
    expect(resolveScreenshotRef('../../src/img/screenshots/grid.png', 'options/legend.md', docsPath, screenshots)).toBe(
      grid
    );
  });

  it('should ignore a query and a fragment', () => {
    expect(resolveScreenshotRef('../src/img/screenshots/grid.png?v=2#top', 'index.md', docsPath, screenshots)).toBe(
      grid
    );
  });

  it('should read percent escapes the way the renderer does', () => {
    expect(resolveScreenshotRef('..%2Fsrc%2Fimg%2Fscreenshots%2Fgrid.png', 'index.md', docsPath, screenshots)).toBe(
      grid
    );
  });

  it('should not match an image that plugin.json does not list', () => {
    expect(resolveScreenshotRef('../src/img/other.png', 'index.md', docsPath, screenshots)).toBeUndefined();
  });

  it('should not match a listed file that is not an allowed image type', () => {
    expect(resolveScreenshotRef('../src/img/logo.svg', 'index.md', docsPath, screenshots)).toBeUndefined();
  });

  it('should not match a root-relative or backslash reference', () => {
    expect(resolveScreenshotRef('/src/img/screenshots/grid.png', 'index.md', docsPath, screenshots)).toBeUndefined();
    expect(
      resolveScreenshotRef('..\\src\\img\\screenshots\\grid.png', 'index.md', docsPath, screenshots)
    ).toBeUndefined();
  });

  it('should not match a path that only ends like a screenshot', () => {
    expect(
      resolveScreenshotRef('../other/src/img/screenshots/grid.png', 'index.md', docsPath, screenshots)
    ).toBeUndefined();
  });

  it('should match nothing without screenshots', () => {
    expect(resolveScreenshotRef('../src/img/screenshots/grid.png', 'index.md', docsPath)).toBeUndefined();
  });

  it('should not match a screenshot inside the docs folder, which is an ordinary docs image', () => {
    const inSource = { root: resolve('/repo/src'), paths: ['docs/img/grid.png'] };

    expect(resolveScreenshotRef('img/grid.png', 'index.md', resolve('/repo/src/docs'), inSource)).toBeUndefined();
  });

  it('should not match a screenshot path that leaves the plugin', () => {
    const outside = { root: resolve('/repo/src'), paths: ['../../shared/hero.png'] };

    expect(resolveScreenshotRef('../../shared/hero.png', 'index.md', docsPath, outside)).toBeUndefined();
  });
});

describe('isInside', () => {
  const root = resolve('/repo/src');

  it('should accept a path inside the root', () => {
    expect(isInside(root, 'img/screenshots/grid.png')).toBe(true);
  });

  it('should accept a name that only starts with two dots', () => {
    expect(isInside(root, '..hidden.png')).toBe(true);
    expect(isInside(root, '..dir/a.png')).toBe(true);
  });

  it('should reject a path that leaves the root', () => {
    expect(isInside(root, '../outside.png')).toBe(false);
    expect(isInside(root, 'img/../../outside.png')).toBe(false);
  });

  it('should reject an absolute path and the root itself', () => {
    expect(isInside(root, resolve('/etc/passwd'))).toBe(false);
    expect(isInside(root, '.')).toBe(false);
  });
});

describe('rewriteScreenshotRefs', () => {
  const built: BuiltDocs = {
    docsPath,
    builtDocsPath: resolve('/repo/dist/catalog-docs'),
    builtRoot: resolve('/repo/dist'),
    screenshots,
  };

  it('should point a root page at the screenshot in the built plugin', () => {
    expect(rewriteScreenshotRefs('![Grid](../src/img/screenshots/grid.png)', 'index.md', built)).toBe(
      '![Grid](../img/screenshots/grid.png)'
    );
  });

  it('should point a nested page at the screenshot in the built plugin', () => {
    expect(rewriteScreenshotRefs('![Grid](../../src/img/screenshots/grid.png)', 'options/legend.md', built)).toBe(
      '![Grid](../../img/screenshots/grid.png)'
    );
  });

  it('should keep the title and the fragment', () => {
    expect(rewriteScreenshotRefs('![Grid](../src/img/screenshots/grid.png#top "Ten lights")', 'index.md', built)).toBe(
      '![Grid](../img/screenshots/grid.png#top "Ten lights")'
    );
  });

  it('should rewrite every image on a line and across the page', () => {
    const content = '![a](../src/img/screenshots/grid.png) and ![b](../src/img/screenshots/grid.png)\n\ntext\n';

    expect(rewriteScreenshotRefs(content, 'index.md', built)).toBe(
      '![a](../img/screenshots/grid.png) and ![b](../img/screenshots/grid.png)\n\ntext\n'
    );
  });

  it('should rewrite a reference definition that an image uses', () => {
    const content = '![Grid][grid]\n\n[grid]: ../src/img/screenshots/grid.png "Grid"\n';

    expect(rewriteScreenshotRefs(content, 'index.md', built)).toBe(
      '![Grid][grid]\n\n[grid]: ../img/screenshots/grid.png "Grid"\n'
    );
  });

  it('should leave code blocks as they are', () => {
    const content = '```md\n![Grid](../src/img/screenshots/grid.png)\n```\n';

    expect(rewriteScreenshotRefs(content, 'index.md', built)).toBe(content);
  });

  it('should return the same text when no screenshot is shown', () => {
    const content = '![Local](img/local.png) and ![Elsewhere](../src/img/other.png)\n';

    expect(rewriteScreenshotRefs(content, 'index.md', built)).toBe(content);
  });

  it('should work when docsPath is nested in the plugin', () => {
    const nested: BuiltDocs = {
      ...built,
      docsPath: resolve('/repo/docs/plugin'),
      builtDocsPath: resolve('/repo/dist/docs/plugin'),
    };

    expect(rewriteScreenshotRefs('![Grid](../../src/img/screenshots/grid.png)', 'index.md', nested)).toBe(
      '![Grid](../../img/screenshots/grid.png)'
    );
  });

  it('should percent-encode a file name that would break the link', () => {
    const spaced: BuiltDocs = { ...built, screenshots: { ...screenshots, paths: ['img/my shot (1).png'] } };

    expect(rewriteScreenshotRefs('![Shot](../src/img/my%20shot%20%281%29.png)', 'index.md', spaced)).toBe(
      '![Shot](../img/my%20shot%20%281%29.png)'
    );
  });

  it('should rewrite the destination of a definition whose label repeats it', () => {
    const ref = '../src/img/screenshots/grid.png';
    const content = `![Grid][${ref}]\n\n[${ref}]: ${ref}\n`;

    expect(rewriteScreenshotRefs(content, 'index.md', built)).toBe(
      `![Grid][${ref}]\n\n[${ref}]: ../img/screenshots/grid.png\n`
    );
  });
});
