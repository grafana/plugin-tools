import { describe, it, expect } from 'vitest';
import { toHtml } from 'hast-util-to-html';
import { parseMarkdown } from '../parser.js';

function render(markdown: string): string {
  return toHtml(parseMarkdown(markdown).hast);
}

describe('rehypeFigure', () => {
  it('should turn an image with a title alone in its paragraph into a figure', () => {
    expect(render('![Query builder](img/builder.png "The query builder")')).toBe(
      '<figure><img src="img/builder.png" alt="Query builder"><figcaption>The query builder</figcaption></figure>'
    );
  });

  it('should keep the link around a linked image', () => {
    expect(render('[![Builder](img/builder.png "The builder")](https://grafana.com)')).toBe(
      '<figure><a href="https://grafana.com"><img src="img/builder.png" alt="Builder"></a><figcaption>The builder</figcaption></figure>'
    );
  });

  it('should leave an image without a title alone', () => {
    expect(render('![Query builder](img/builder.png)')).toBe('<p><img src="img/builder.png" alt="Query builder"></p>');
  });

  it('should leave an image inside a sentence alone', () => {
    const html = render('Click ![gear](img/gear.png "Settings") to open settings.');

    expect(html).not.toContain('<figure>');
    expect(html).toContain('title="Settings"');
  });

  it('should leave two images in one paragraph alone', () => {
    expect(render('![a](img/a.png "A")\n![b](img/b.png "B")')).not.toContain('<figure>');
  });

  it('should caption each image separated by a blank line', () => {
    expect(render('![a](img/a.png "A")\n\n![b](img/b.png "B")').match(/<figcaption>/g)).toHaveLength(2);
  });

  it('should keep the rewritten CDN path', () => {
    const { hast } = parseMarkdown('![Builder](./img/builder.png "Caption")', {
      assetBaseUrl: 'https://cdn.example.com/docs',
      file: 'index.md',
    });

    expect(toHtml(hast)).toContain('src="https://cdn.example.com/docs/img/builder.png"');
  });

  it('should escape a caption that looks like HTML', () => {
    expect(render('![x](img/x.png "<script>alert(1)</script>")')).toContain(
      '<figcaption>&#x3C;script>alert(1)&#x3C;/script></figcaption>'
    );
  });
});
