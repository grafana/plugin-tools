import type { Locator, Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const IMG_DIR = join(__dirname, '..', '{{docsPath}}', 'img');
// the max-image-size limit in @grafana/plugin-docs-cli. `docs:validate` is the real check
const MAX_IMAGE_BYTES = 300 * 1024;
// 1 is lossless. lower values trade sharpness for size, and text blurs below 0.7
const WEBP_QUALITIES = [1, 0.9, 0.8, 0.7];
const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface CaptureOptions {
  /** Elements to cover with a box, such as anything that shows a hostname or a key. */
  mask?: Locator[];
}

/**
 * Saves a screenshot of a page or an element as `<docsPath>/img/<name>.webp` and returns its path from a page
 * at the top of the docs folder, `./img/<name>.webp`. A page in a subfolder needs `../img/<name>.webp`.
 * Fails when the image is over the docs size limit.
 */
export async function captureDocsScreenshot(
  target: Page | Locator,
  name: string,
  options: CaptureOptions = {}
): Promise<string> {
  if (!NAME_RE.test(name)) {
    throw new Error(`"${name}" isn't a valid screenshot name. Use lowercase letters, digits and hyphens.`);
  }

  const page = 'goto' in target ? target : target.page();
  const png = await target.screenshot({ animations: 'disabled', caret: 'hide', scale: 'css', mask: options.mask });

  const webp = await encodeWebp(page, png);
  if (webp) {
    mkdirSync(IMG_DIR, { recursive: true });
    writeFileSync(join(IMG_DIR, `${name}.webp`), webp);
    return `./img/${name}.webp`;
  }

  throw new Error(
    `The "${name}" screenshot is over ${MAX_IMAGE_BYTES / 1024}KB even at the lowest quality. Capture a smaller element, or a smaller part of the page.`
  );
}

// re-encoded in a blank page, so the plugin page's content security policy can't block the data URL
async function encodeWebp(page: Page, png: Buffer): Promise<Buffer | undefined> {
  const scratch = await page.context().newPage();
  try {
    const dataUrl = await scratch.evaluate(
      async ({ base64, qualities, maxBytes }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.getContext('2d')?.drawImage(image, 0, 0);
        for (const quality of qualities) {
          const url = canvas.toDataURL('image/webp', quality);
          // base64 is 4 characters for every 3 bytes. a non-WebP result is returned so the caller can report it
          if (!url.startsWith('data:image/webp') || ((url.length - url.indexOf(',') - 1) * 3) / 4 <= maxBytes) {
            return url;
          }
        }
        return undefined;
      },
      { base64: png.toString('base64'), qualities: WEBP_QUALITIES, maxBytes: MAX_IMAGE_BYTES }
    );
    if (dataUrl === undefined) {
      return undefined;
    }
    if (!dataUrl.startsWith('data:image/webp')) {
      throw new Error('This browser cannot encode WebP images. Run docs:screenshots in Chromium.');
    }
    return Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
  } finally {
    await scratch.close();
  }
}
