import { describe, it, expect } from 'vitest';
import { toHtml } from 'hast-util-to-html';
import { parseMarkdown } from '../parser.js';

function render(markdown: string, assetBaseUrl?: string): string {
  return toHtml(parseMarkdown(markdown, assetBaseUrl ? { assetBaseUrl } : undefined).hast);
}

describe('rehypeVideo', () => {
  it.each(['mp4', 'webm'])('should turn a %s image into a video', (ext) => {
    const html = render(`![Agenda view](./video/agenda.${ext} "Switching views")`);

    expect(html).toContain(`<video src="./video/agenda.${ext}"`);
    expect(html).toContain('controls');
    expect(html).toContain('muted');
    expect(html).toContain('playsinline');
    expect(html).toContain('preload="metadata"');
    expect(html).toContain('aria-label="Agenda view"');
    expect(html).toContain('title="Switching views"');
    expect(html).not.toContain('<img');
  });

  it('should not autoplay or loop', () => {
    const html = render('![Demo](./demo.mp4)');

    expect(html).not.toContain('autoplay');
    expect(html).not.toContain('loop');
  });

  it('should keep a link to the file as the fallback', () => {
    expect(render('![Agenda view](./agenda.mp4)')).toContain('<a href="./agenda.mp4">Agenda view</a></video>');
  });

  it('should name the fallback link when there is no alt text', () => {
    const html = render('![](./agenda.mp4)');

    expect(html).toContain('>Video</a>');
    expect(html).not.toContain('aria-label');
  });

  it('should use the rewritten asset URL', () => {
    const html = render('![Demo](./video/demo.mp4)', 'https://cdn.example.com/plugin/docs');

    expect(html).toContain('src="https://cdn.example.com/plugin/docs/video/demo.mp4"');
  });

  it('should match a file extension in any case and ignore a query string', () => {
    expect(render('![Demo](./DEMO.MP4)')).toContain('<video');
    expect(render('![Demo](./demo.mp4?v=2)')).toContain('<video');
  });

  it('should leave images alone', () => {
    const html = render('![Shot](./shot.png) ![Mp4 in name](./demo.mp4.png)');

    expect(html).not.toContain('<video');
    expect(html).toContain('<img');
  });

  it('should not let authors write a video element', () => {
    expect(render('<video src="./demo.mp4" autoplay></video>')).not.toContain('<video');
  });

  it('should leave an image inside a link alone', () => {
    const html = render('[![Demo](./demo.mp4)](https://example.com)');

    expect(html).not.toContain('<video');
    expect(html).toContain('<img src="./demo.mp4"');
  });

  it('should leave a link to a video file as a link', () => {
    const html = render('[Download](./demo.mp4)');

    expect(html).not.toContain('<video');
    expect(html).toContain('<a href="./demo.mp4">Download</a>');
  });
});
