import { describe, it, expect } from 'vitest';
import { toHtml } from 'hast-util-to-html';
import { parseMarkdown } from '../parser.js';
import { getYouTubeVideoId } from './rehype-youtube.js';

function render(markdown: string): string {
  return toHtml(parseMarkdown(markdown).hast);
}

const ID = 'Qc83dSVe0vQ';

describe('rehypeYouTube', () => {
  it.each([
    ['watch', `https://www.youtube.com/watch?v=${ID}`],
    ['watch without www', `https://youtube.com/watch?v=${ID}&t=30s`],
    ['short', `https://youtu.be/${ID}`],
    ['embed', `https://www.youtube.com/embed/${ID}`],
    ['shorts', `https://www.youtube.com/shorts/${ID}`],
  ])('should embed a %s link alone in a paragraph', (_name, url) => {
    const html = render(`[Getting started](${url})`);

    expect(html).toContain(`<div class="youtube-embed" data-video-id="${ID}">`);
    expect(html).toContain(`<a href="https://www.youtube.com/watch?v=${ID}">Getting started</a>`);
    expect(html).not.toContain('<p>');
  });

  it('should embed a bare URL and name it for screen readers', () => {
    const html = render(`https://youtu.be/${ID}`);

    expect(html).toContain(`data-video-id="${ID}"`);
    expect(html).toContain('>Watch on YouTube</a>');
  });

  it('should not use a www autolink as the title', () => {
    expect(render(`www.youtube.com/watch?v=${ID}`)).toContain('>Watch on YouTube</a>');
  });

  it('should leave links in a loose list alone', () => {
    const html = render(`- [A](https://youtu.be/${ID})\n\n- [B](https://youtu.be/${ID})`);

    expect(html).not.toContain('youtube-embed');
  });

  it('should keep formatted link text as the title', () => {
    expect(render(`[**Bold** demo](https://youtu.be/${ID})`)).toContain('>Bold demo</a>');
  });

  it('should leave a link inside a sentence alone', () => {
    const html = render(`Watch [the demo](https://youtu.be/${ID}) first.`);

    expect(html).toContain('<p>Watch <a');
    expect(html).not.toContain('youtube-embed');
  });

  it('should leave a link with more content in the paragraph alone', () => {
    const html = render(`[Demo](https://youtu.be/${ID}) and [more](https://youtu.be/${ID})`);

    expect(html).not.toContain('youtube-embed');
  });

  it('should leave a YouTube link with an invalid id alone', () => {
    expect(render('[Demo](https://www.youtube.com/watch?v=short)')).not.toContain('youtube-embed');
    expect(render('[Demo](https://www.youtube.com/watch)')).not.toContain('youtube-embed');
  });

  it('should leave a non-YouTube link alone', () => {
    expect(render(`[Demo](https://example.com/watch?v=${ID})`)).not.toContain('youtube-embed');
    expect(render(`[Demo](https://youtube.com.evil.example/watch?v=${ID})`)).not.toContain('youtube-embed');
  });

  it('should not let authors write the embed markup', () => {
    const html = render(`<div class="youtube-embed" data-video-id="${ID}">x</div>`);

    expect(html).not.toContain('youtube-embed');
  });

  it('should not turn an image link into an embed', () => {
    expect(render(`[![x](./a.png)](https://youtu.be/${ID})`)).not.toContain('youtube-embed');
  });
});

describe('getYouTubeVideoId', () => {
  it('should reject non-http schemes and malformed URLs', () => {
    expect(getYouTubeVideoId(`javascript:alert(1)//youtu.be/${ID}`)).toBeUndefined();
    expect(getYouTubeVideoId('not a url')).toBeUndefined();
  });
});
