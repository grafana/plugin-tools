import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { checkAssets } from './assets.js';
import { Rule } from '../types.js';

const input = (docsPath: string, strict = true) => ({ docsPath, strict });

// helper: valid frontmatter markdown file content
const md = (body = '') => `---\ntitle: Page\ndescription: A page\n---\n${body}`;

// helper: creates a buffer of a given size in bytes
function bufferOfSize(bytes: number): Buffer {
  return Buffer.alloc(bytes, 0);
}

// helper: creates a base64 string of approximately the given byte size
function base64OfSize(bytes: number): string {
  const buf = Buffer.alloc(bytes, 0);
  return buf.toString('base64');
}

describe('checkAssets', () => {
  it('should return empty for nonexistent path', async () => {
    const findings = await checkAssets(input('/nonexistent/path'));
    expect(findings).toHaveLength(0);
  });

  it('should return empty for docs with no images', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
    await writeFile(join(tmp, 'index.md'), md('## Hello'));

    const findings = await checkAssets(input(tmp));
    expect(findings).toHaveLength(0);
  });

  // --- no-svg-files ---

  describe('no-svg-files', () => {
    it('should report SVG files as error', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'icon.svg'), '<svg></svg>');

      const findings = await checkAssets(input(tmp));

      const svgs = findings.filter((f) => f.rule === Rule.NoSvg);
      expect(svgs).toHaveLength(1);
      expect(svgs[0].severity).toBe('error');
      expect(svgs[0].file).toContain('icon.svg');
    });

    it('should report SVG files as error even in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await writeFile(join(tmp, 'diagram.svg'), '<svg></svg>');

      const findings = await checkAssets(input(tmp, false));

      const svgs = findings.filter((f) => f.rule === Rule.NoSvg);
      expect(svgs).toHaveLength(1);
      expect(svgs[0].severity).toBe('error');
    });
  });

  // --- image-file-naming ---

  describe('image-file-naming', () => {
    it('should not report valid image filenames', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'my-screenshot_01.png'), bufferOfSize(100));

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.ImageFileNaming)).toHaveLength(0);
    });

    it('should not report uppercase in image filename', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'Screenshot.png'), bufferOfSize(100));

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.ImageFileNaming)).toHaveLength(0);
    });

    it('should report spaces in image filename', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'my screenshot.png'), bufferOfSize(100));

      const findings = await checkAssets(input(tmp));

      const naming = findings.filter((f) => f.rule === Rule.ImageFileNaming);
      expect(naming).toHaveLength(1);
    });

    it('should report as info in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'my screenshot.png'), bufferOfSize(100));

      const findings = await checkAssets(input(tmp, false));

      const naming = findings.filter((f) => f.rule === Rule.ImageFileNaming);
      expect(naming).toHaveLength(1);
      expect(naming[0].severity).toBe('info');
    });
  });

  // --- max-image-size ---

  describe('max-image-size', () => {
    it('should not report images under the size limit', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'small.png'), bufferOfSize(100 * 1024)); // 100KB

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.MaxImageSize)).toHaveLength(0);
    });

    it('should report static images over 300KB', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'large.png'), bufferOfSize(400 * 1024)); // 400KB

      const findings = await checkAssets(input(tmp));

      const size = findings.filter((f) => f.rule === Rule.MaxImageSize);
      expect(size).toHaveLength(1);
      expect(size[0].severity).toBe('error');
      expect(size[0].title).toContain('300KB');
    });

    it('should not report GIF under 1MB', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'animation.gif'), bufferOfSize(500 * 1024)); // 500KB

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.MaxImageSize)).toHaveLength(0);
    });

    it('should report GIF over 1MB', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'heavy.gif'), bufferOfSize(1.5 * 1024 * 1024)); // 1.5MB

      const findings = await checkAssets(input(tmp));

      const size = findings.filter((f) => f.rule === Rule.MaxImageSize);
      expect(size).toHaveLength(1);
      expect(size[0].title).toContain('1MB');
    });

    it('should report as info in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'large.png'), bufferOfSize(400 * 1024));

      const findings = await checkAssets(input(tmp, false));

      const size = findings.filter((f) => f.rule === Rule.MaxImageSize);
      expect(size).toHaveLength(1);
      expect(size[0].severity).toBe('info');
    });
  });

  // --- max-total-images-size ---

  describe('max-total-images-size', () => {
    it('should not report when total is under 5MB', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'a.png'), bufferOfSize(1024 * 1024)); // 1MB

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.MaxTotalImagesSize)).toHaveLength(0);
    });

    it('should report when total exceeds 5MB in strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      // write 6 images at 1MB each = 6MB total
      for (let i = 0; i < 6; i++) {
        await writeFile(join(tmp, 'img', `img-${i}.png`), bufferOfSize(1024 * 1024));
      }

      const findings = await checkAssets(input(tmp));

      const total = findings.filter((f) => f.rule === Rule.MaxTotalImagesSize);
      expect(total).toHaveLength(1);
      expect(total[0].severity).toBe('warning');
    });

    it('should not report in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      for (let i = 0; i < 6; i++) {
        await writeFile(join(tmp, 'img', `img-${i}.png`), bufferOfSize(1024 * 1024));
      }

      const findings = await checkAssets(input(tmp, false));
      expect(findings.filter((f) => f.rule === Rule.MaxTotalImagesSize)).toHaveLength(0);
    });
  });

  // --- max-data-uri-size ---

  describe('max-data-uri-size', () => {
    it('should not report small data URIs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      const smallB64 = base64OfSize(100);
      await writeFile(join(tmp, 'index.md'), md(`![pixel](data:image/png;base64,${smallB64})`));

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.MaxDataUriSize)).toHaveLength(0);
    });

    it('should report data URIs over 300KB', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      const largeB64 = base64OfSize(400 * 1024);
      await writeFile(join(tmp, 'index.md'), md(`![big](data:image/png;base64,${largeB64})`));

      const findings = await checkAssets(input(tmp));

      const dataUri = findings.filter((f) => f.rule === Rule.MaxDataUriSize);
      expect(dataUri).toHaveLength(1);
      expect(dataUri[0].severity).toBe('error');
      expect(dataUri[0].title).toContain('300KB');
    });

    it('should report as info in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      const largeB64 = base64OfSize(400 * 1024);
      await writeFile(join(tmp, 'index.md'), md(`![big](data:image/png;base64,${largeB64})`));

      const findings = await checkAssets(input(tmp, false));

      const dataUri = findings.filter((f) => f.rule === Rule.MaxDataUriSize);
      expect(dataUri).toHaveLength(1);
      expect(dataUri[0].severity).toBe('info');
    });

    it('should not report data URIs for the referenced-images-exist rule', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      const largeB64 = base64OfSize(400 * 1024);
      await writeFile(join(tmp, 'index.md'), md(`![big](data:image/png;base64,${largeB64})`));

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.ReferencedImagesExist)).toHaveLength(0);
    });
  });

  // --- referenced-images-exist ---

  describe('referenced-images-exist', () => {
    it('should not report when referenced image exists', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'screenshot.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'index.md'), md('![alt](img/screenshot.png)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.ReferencedImagesExist)).toHaveLength(0);
    });

    it('should report when referenced image does not exist', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md('![alt](img/missing.png)'));

      const findings = await checkAssets(input(tmp));

      const refs = findings.filter((f) => f.rule === Rule.ReferencedImagesExist);
      expect(refs).toHaveLength(1);
      expect(refs[0].severity).toBe('error');
      expect(refs[0].detail).toContain('missing.png');
    });

    it('should include line number for broken reference', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md('\n\n![alt](img/gone.png)\n'));

      const findings = await checkAssets(input(tmp));

      const refs = findings.filter((f) => f.rule === Rule.ReferencedImagesExist);
      expect(refs).toHaveLength(1);
      expect(refs[0].line).toBeDefined();
      expect(refs[0].line).toBeGreaterThan(1);
    });

    it('should resolve references relative to the markdown file', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'sub'));
      await mkdir(join(tmp, 'sub', 'img'));
      await writeFile(join(tmp, 'sub', 'img', 'diagram.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'sub', 'page.md'), md('![diagram](img/diagram.png)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.ReferencedImagesExist)).toHaveLength(0);
    });

    it('should handle ./ prefix in image refs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'screenshot.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'index.md'), md('![alt](./img/screenshot.png)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.ReferencedImagesExist)).toHaveLength(0);
    });

    it('should skip external URLs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md('![logo](https://example.com/logo.png)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.ReferencedImagesExist)).toHaveLength(0);
    });

    it('should skip protocol-relative URLs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md('![logo](//cdn.example.com/logo.png)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.ReferencedImagesExist)).toHaveLength(0);
    });

    it('should skip blob URLs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md('![img](blob:http://localhost/abc)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.ReferencedImagesExist)).toHaveLength(0);
    });

    it('should resolve root-relative paths against docs root', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'logo.png'), bufferOfSize(100));
      await mkdir(join(tmp, 'sub'));
      await writeFile(join(tmp, 'sub', 'page.md'), md('![logo](/img/logo.png)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.ReferencedImagesExist)).toHaveLength(0);
    });

    it('should skip data URIs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md('![pixel](data:image/png;base64,abc123)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.ReferencedImagesExist)).toHaveLength(0);
    });

    it('should report references that escape the docs root via ../../../', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md('![escape](../../etc/passwd)'));

      const findings = await checkAssets(input(tmp));

      const refs = findings.filter((f) => f.rule === Rule.ReferencedImagesExist);
      expect(refs).toHaveLength(1);
      expect(refs[0].severity).toBe('error');
    });

    it('should report multiple broken references in the same file', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md('![a](img/one.png)\n![b](img/two.png)'));

      const findings = await checkAssets(input(tmp));

      const refs = findings.filter((f) => f.rule === Rule.ReferencedImagesExist);
      expect(refs).toHaveLength(2);
    });

    it('should resolve ../img/ references from a subdirectory', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'logo.png'), bufferOfSize(100));
      await mkdir(join(tmp, 'docs', 'getting-started'), { recursive: true });
      await writeFile(join(tmp, 'docs', 'getting-started', 'index.md'), md('![logo](../../img/logo.png)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.ReferencedImagesExist)).toHaveLength(0);
    });

    it('should handle image refs with title attributes', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'chart.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'index.md'), md('![chart](img/chart.png "A chart showing data")'));

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.ReferencedImagesExist)).toHaveLength(0);
    });

    it('should report broken ref with title attribute', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md('![chart](img/missing.png "A chart")'));

      const findings = await checkAssets(input(tmp));

      const refs = findings.filter((f) => f.rule === Rule.ReferencedImagesExist);
      expect(refs).toHaveLength(1);
    });

    it('should handle multiple markdown files with mixed valid and broken refs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'valid.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'page1.md'), md('![ok](img/valid.png)\n![broken](img/nope.png)'));
      await writeFile(join(tmp, 'page2.md'), md('![also-broken](img/missing.png)'));

      const findings = await checkAssets(input(tmp));

      const refs = findings.filter((f) => f.rule === Rule.ReferencedImagesExist);
      expect(refs).toHaveLength(2);
      const files = refs.map((r) => r.file);
      expect(files).toContain('page1.md');
      expect(files).toContain('page2.md');
    });

    it('should handle deeply nested directories with relative refs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'a', 'b', 'c', 'img'), { recursive: true });
      await writeFile(join(tmp, 'a', 'b', 'c', 'img', 'deep.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'a', 'b', 'c', 'page.md'), md('![deep](img/deep.png)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.ReferencedImagesExist)).toHaveLength(0);
    });

    it('should not match HTML img tags', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md('<img src="img/photo.png" />'));

      const findings = await checkAssets(input(tmp));
      // html img tags are not matched by the markdown regex, so no broken ref reported
      expect(findings.filter((f) => f.rule === Rule.ReferencedImagesExist)).toHaveLength(0);
    });
  });

  // --- no-orphaned-images ---

  describe('no-orphaned-images', () => {
    it('should not report referenced images', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'used.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'index.md'), md('![alt](img/used.png)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.NoOrphanedImages)).toHaveLength(0);
    });

    it('should report unreferenced images in img/ in strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'orphan.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'index.md'), md('## No images here'));

      const findings = await checkAssets(input(tmp));

      const orphans = findings.filter((f) => f.rule === Rule.NoOrphanedImages);
      expect(orphans).toHaveLength(1);
      expect(orphans[0].severity).toBe('info');
      expect(orphans[0].file).toContain('orphan.png');
    });

    it('should not report in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'orphan.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'index.md'), md('## No images'));

      const findings = await checkAssets(input(tmp, false));
      expect(findings.filter((f) => f.rule === Rule.NoOrphanedImages)).toHaveLength(0);
    });

    it('should report unreferenced images anywhere as orphaned', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'stray.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'index.md'), md('## No images'));

      const findings = await checkAssets(input(tmp));

      const orphans = findings.filter((f) => f.rule === Rule.NoOrphanedImages);
      expect(orphans).toHaveLength(1);
      expect(orphans[0].severity).toBe('info');
      expect(orphans[0].file).toContain('stray.png');
    });

    it('should handle references to img subdirectories', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'img', 'screenshots'), { recursive: true });
      await writeFile(join(tmp, 'img', 'screenshots', 'step1.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'index.md'), md('![step](img/screenshots/step1.png)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.NoOrphanedImages)).toHaveLength(0);
      expect(findings.filter((f) => f.rule === Rule.ReferencedImagesExist)).toHaveLength(0);
    });

    it('should detect references from different markdown files', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'shared.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'index.md'), md('## Home'));
      // referenced from a different file
      await writeFile(join(tmp, 'other.md'), md('![pic](img/shared.png)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.NoOrphanedImages)).toHaveLength(0);
    });
  });
});
