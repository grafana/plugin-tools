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

      const svg = findings.find((f) => f.rule === Rule.NoSvg);
      expect(svg).toBeDefined();
      expect(svg!.severity).toBe('error');
      expect(svg!.file).toContain('icon.svg');
    });

    it('should report SVG files as error even in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await writeFile(join(tmp, 'diagram.svg'), '<svg></svg>');

      const findings = await checkAssets(input(tmp, false));

      const svg = findings.find((f) => f.rule === Rule.NoSvg);
      expect(svg).toBeDefined();
      expect(svg!.severity).toBe('error');
    });
  });

  // --- images-in-img-dir ---

  describe('images-in-img-dir', () => {
    it('should not report images inside img/ directory', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md('![alt](img/screenshot.png)'));
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'screenshot.png'), bufferOfSize(100));

      const findings = await checkAssets(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ImagesInImgDir)).toBeUndefined();
    });

    it('should not report images inside nested img/ directory', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'sub'), { recursive: true });
      await mkdir(join(tmp, 'sub', 'img'));
      await writeFile(join(tmp, 'sub', 'img', 'diagram.png'), bufferOfSize(100));

      const findings = await checkAssets(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ImagesInImgDir)).toBeUndefined();
    });

    it('should not report images inside img/ subdirectory', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img', 'screenshots'), { recursive: true });
      await writeFile(join(tmp, 'img', 'screenshots', 'step1.png'), bufferOfSize(100));

      const findings = await checkAssets(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ImagesInImgDir)).toBeUndefined();
    });

    it('should report images in docs root', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await writeFile(join(tmp, 'screenshot.png'), bufferOfSize(100));

      const findings = await checkAssets(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.ImagesInImgDir);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
    });

    it('should report images in non-img directory', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'assets'));
      await writeFile(join(tmp, 'assets', 'photo.jpg'), bufferOfSize(100));

      const findings = await checkAssets(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.ImagesInImgDir);
      expect(finding).toBeDefined();
      expect(finding!.file).toContain('photo.jpg');
    });

    it('should report as info in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await writeFile(join(tmp, 'screenshot.png'), bufferOfSize(100));

      const findings = await checkAssets(input(tmp, false));

      const finding = findings.find((f) => f.rule === Rule.ImagesInImgDir);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('info');
    });
  });

  // --- allowed-image-formats ---

  describe('allowed-image-formats', () => {
    it('should not report allowed image formats in img/', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'a.png'), '');
      await writeFile(join(tmp, 'img', 'b.jpg'), '');
      await writeFile(join(tmp, 'img', 'c.jpeg'), '');
      await writeFile(join(tmp, 'img', 'd.webp'), '');
      await writeFile(join(tmp, 'img', 'e.gif'), '');

      const findings = await checkAssets(input(tmp));
      expect(findings.find((f) => f.rule === Rule.AllowedImageFormats)).toBeUndefined();
    });

    it('should report disallowed formats in img/', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'photo.bmp'), '');

      const findings = await checkAssets(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.AllowedImageFormats);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
      expect(finding!.file).toContain('photo.bmp');
    });

    it('should report as info in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'photo.tiff'), '');

      const findings = await checkAssets(input(tmp, false));

      const finding = findings.find((f) => f.rule === Rule.AllowedImageFormats);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('info');
    });

    it('should not flag SVG in img/ (handled by no-svg-files)', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'icon.svg'), '<svg></svg>');

      const findings = await checkAssets(input(tmp));

      // should have no-svg-files but not allowed-image-formats
      expect(findings.find((f) => f.rule === Rule.NoSvg)).toBeDefined();
      expect(findings.find((f) => f.rule === Rule.AllowedImageFormats)).toBeUndefined();
    });

    it('should not report files outside img/', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await writeFile(join(tmp, 'notes.txt'), 'hello');

      const findings = await checkAssets(input(tmp));
      expect(findings.find((f) => f.rule === Rule.AllowedImageFormats)).toBeUndefined();
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
      expect(findings.find((f) => f.rule === Rule.ImageFileNaming)).toBeUndefined();
    });

    it('should report uppercase in image filename', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'Screenshot.png'), bufferOfSize(100));

      const findings = await checkAssets(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.ImageFileNaming);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
    });

    it('should report spaces in image filename', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'my screenshot.png'), bufferOfSize(100));

      const findings = await checkAssets(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.ImageFileNaming);
      expect(finding).toBeDefined();
    });

    it('should report as info in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'BadName.png'), bufferOfSize(100));

      const findings = await checkAssets(input(tmp, false));

      const finding = findings.find((f) => f.rule === Rule.ImageFileNaming);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('info');
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
      expect(findings.find((f) => f.rule === Rule.MaxImageSize)).toBeUndefined();
    });

    it('should report static images over 300KB', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'large.png'), bufferOfSize(400 * 1024)); // 400KB

      const findings = await checkAssets(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.MaxImageSize);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
      expect(finding!.title).toContain('300KB');
    });

    it('should not report GIF under 1MB', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'animation.gif'), bufferOfSize(500 * 1024)); // 500KB

      const findings = await checkAssets(input(tmp));
      expect(findings.find((f) => f.rule === Rule.MaxImageSize)).toBeUndefined();
    });

    it('should report GIF over 1MB', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'heavy.gif'), bufferOfSize(1.5 * 1024 * 1024)); // 1.5MB

      const findings = await checkAssets(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.MaxImageSize);
      expect(finding).toBeDefined();
      expect(finding!.title).toContain('1MB');
    });

    it('should report as info in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'large.png'), bufferOfSize(400 * 1024));

      const findings = await checkAssets(input(tmp, false));

      const finding = findings.find((f) => f.rule === Rule.MaxImageSize);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('info');
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
      expect(findings.find((f) => f.rule === Rule.MaxTotalImagesSize)).toBeUndefined();
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

      const finding = findings.find((f) => f.rule === Rule.MaxTotalImagesSize);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('warning');
    });

    it('should not report in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md());
      await mkdir(join(tmp, 'img'));
      for (let i = 0; i < 6; i++) {
        await writeFile(join(tmp, 'img', `img-${i}.png`), bufferOfSize(1024 * 1024));
      }

      const findings = await checkAssets(input(tmp, false));
      expect(findings.find((f) => f.rule === Rule.MaxTotalImagesSize)).toBeUndefined();
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
      expect(findings.find((f) => f.rule === Rule.ReferencedImagesExist)).toBeUndefined();
    });

    it('should report when referenced image does not exist', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md('![alt](img/missing.png)'));

      const findings = await checkAssets(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.ReferencedImagesExist);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
      expect(finding!.detail).toContain('missing.png');
    });

    it('should include line number for broken reference', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md('\n\n![alt](img/gone.png)\n'));

      const findings = await checkAssets(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.ReferencedImagesExist);
      expect(finding).toBeDefined();
      expect(finding!.line).toBeDefined();
      expect(finding!.line).toBeGreaterThan(1);
    });

    it('should resolve references relative to the markdown file', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'sub'));
      await mkdir(join(tmp, 'sub', 'img'));
      await writeFile(join(tmp, 'sub', 'img', 'diagram.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'sub', 'page.md'), md('![diagram](img/diagram.png)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ReferencedImagesExist)).toBeUndefined();
    });

    it('should handle ./ prefix in image refs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'screenshot.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'index.md'), md('![alt](./img/screenshot.png)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ReferencedImagesExist)).toBeUndefined();
    });

    it('should skip external URLs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md('![logo](https://example.com/logo.png)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ReferencedImagesExist)).toBeUndefined();
    });

    it('should skip protocol-relative URLs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md('![logo](//cdn.example.com/logo.png)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ReferencedImagesExist)).toBeUndefined();
    });

    it('should skip blob URLs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md('![img](blob:http://localhost/abc)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ReferencedImagesExist)).toBeUndefined();
    });

    it('should resolve root-relative paths against docs root', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'logo.png'), bufferOfSize(100));
      await mkdir(join(tmp, 'sub'));
      await writeFile(join(tmp, 'sub', 'page.md'), md('![logo](/img/logo.png)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ReferencedImagesExist)).toBeUndefined();
    });

    it('should skip data URIs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md('![pixel](data:image/png;base64,abc123)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ReferencedImagesExist)).toBeUndefined();
    });

    it('should report multiple broken references in the same file', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'index.md'), md('![a](img/one.png)\n![b](img/two.png)'));

      const findings = await checkAssets(input(tmp));

      const refs = findings.filter((f) => f.rule === Rule.ReferencedImagesExist);
      expect(refs).toHaveLength(2);
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
      expect(findings.find((f) => f.rule === Rule.NoOrphanedImages)).toBeUndefined();
    });

    it('should report unreferenced images in img/ in strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'orphan.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'index.md'), md('## No images here'));

      const findings = await checkAssets(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.NoOrphanedImages);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('info');
      expect(finding!.file).toContain('orphan.png');
    });

    it('should not report in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'orphan.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'index.md'), md('## No images'));

      const findings = await checkAssets(input(tmp, false));
      expect(findings.find((f) => f.rule === Rule.NoOrphanedImages)).toBeUndefined();
    });

    it('should not report images outside img/ as orphaned', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await writeFile(join(tmp, 'stray.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'index.md'), md('## No images'));

      const findings = await checkAssets(input(tmp));
      // should have images-in-img-dir but not no-orphaned-images
      expect(findings.find((f) => f.rule === Rule.ImagesInImgDir)).toBeDefined();
      expect(findings.find((f) => f.rule === Rule.NoOrphanedImages)).toBeUndefined();
    });

    it('should handle references to img subdirectories', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'img', 'screenshots'), { recursive: true });
      await writeFile(join(tmp, 'img', 'screenshots', 'step1.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'index.md'), md('![step](img/screenshots/step1.png)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoOrphanedImages)).toBeUndefined();
      expect(findings.find((f) => f.rule === Rule.ReferencedImagesExist)).toBeUndefined();
    });

    it('should detect references from different markdown files', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'asset-test-'));
      await mkdir(join(tmp, 'img'));
      await writeFile(join(tmp, 'img', 'shared.png'), bufferOfSize(100));
      await writeFile(join(tmp, 'index.md'), md('## Home'));
      // referenced from a different file
      await writeFile(join(tmp, 'other.md'), md('![pic](img/shared.png)'));

      const findings = await checkAssets(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoOrphanedImages)).toBeUndefined();
    });
  });
});
