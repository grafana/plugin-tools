import { describe, it, expect } from 'vitest';
import type { Root, Element } from 'hast';
import { rehypeRewriteAssetPaths } from './rehype-rewrite-asset-paths.js';

function img(src: string): Element {
  return { type: 'element', tagName: 'img', properties: { src }, children: [] };
}

function tree(...children: Element[]): Root {
  return { type: 'root', children };
}

describe('rehypeRewriteAssetPaths', () => {
  const base = 'https://cdn.example.com/plugin/1.0.0/docs';
  const transform = rehypeRewriteAssetPaths({ assetBaseUrl: base });

  it('should rewrite a relative src to an absolute CDN URL', () => {
    const node = img('img/screenshot.png');
    transform(tree(node));

    expect(node.properties.src).toBe(`${base}/img/screenshot.png`);
  });

  it('should leave https URLs untouched', () => {
    const node = img('https://example.com/logo.png');
    transform(tree(node));

    expect(node.properties.src).toBe('https://example.com/logo.png');
  });

  it('should leave http URLs untouched', () => {
    const node = img('http://example.com/logo.png');
    transform(tree(node));

    expect(node.properties.src).toBe('http://example.com/logo.png');
  });

  it('should leave protocol-relative URLs untouched', () => {
    const node = img('//example.com/logo.png');
    transform(tree(node));

    expect(node.properties.src).toBe('//example.com/logo.png');
  });

  it('should strip trailing slash from base URL', () => {
    const t = rehypeRewriteAssetPaths({ assetBaseUrl: base + '/' });
    const node = img('img/foo.png');
    t(tree(node));

    expect(node.properties.src).toBe(`${base}/img/foo.png`);
  });

  it('should not touch non-img elements', () => {
    const anchor: Element = {
      type: 'element',
      tagName: 'a',
      properties: { href: 'page.md' },
      children: [],
    };
    transform(tree(anchor));

    expect(anchor.properties.href).toBe('page.md');
  });

  it('should leave data: URIs untouched', () => {
    const node = img('data:image/png;base64,iVBORw0KGgo=');
    transform(tree(node));

    expect(node.properties.src).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('should leave blob: URLs untouched', () => {
    const node = img('blob:http://localhost:3000/abc-123');
    transform(tree(node));

    expect(node.properties.src).toBe('blob:http://localhost:3000/abc-123');
  });

  it('should leave root-relative URLs untouched', () => {
    const node = img('/images/logo.png');
    transform(tree(node));

    expect(node.properties.src).toBe('/images/logo.png');
  });

  it('should skip img elements without a string src', () => {
    const node: Element = {
      type: 'element',
      tagName: 'img',
      properties: {},
      children: [],
    };
    transform(tree(node));

    expect(node.properties.src).toBeUndefined();
  });

  describe('with file option (per-page resolution)', () => {
    const baseWithFile = 'https://cdn.example.com/foo/docs';

    it('should resolve relative src from the doc file directory, not the docs root', () => {
      const t = rehypeRewriteAssetPaths({ assetBaseUrl: baseWithFile, file: 'examples/azure.md' });
      const node = img('img/screenshot.png');
      t(tree(node));

      expect(node.properties.src).toBe(`${baseWithFile}/examples/img/screenshot.png`);
    });

    it('should normalize ./ in relative srcs', () => {
      const t = rehypeRewriteAssetPaths({ assetBaseUrl: baseWithFile, file: 'examples/azure.md' });
      const node = img('./img/screenshot.png');
      t(tree(node));

      expect(node.properties.src).toBe(`${baseWithFile}/examples/img/screenshot.png`);
    });

    it('should resolve ../ relative srcs against the parent directory', () => {
      const t = rehypeRewriteAssetPaths({ assetBaseUrl: baseWithFile, file: 'examples/azure.md' });
      const node = img('../shared/logo.png');
      t(tree(node));

      expect(node.properties.src).toBe(`${baseWithFile}/shared/logo.png`);
    });

    it('should resolve from assetBaseUrl when file is at the root', () => {
      const t = rehypeRewriteAssetPaths({ assetBaseUrl: baseWithFile, file: 'index.md' });
      const node = img('img/foo.png');
      t(tree(node));

      expect(node.properties.src).toBe(`${baseWithFile}/img/foo.png`);
    });

    it('should resolve from assetBaseUrl when file is empty', () => {
      const t = rehypeRewriteAssetPaths({ assetBaseUrl: baseWithFile, file: '' });
      const node = img('img/foo.png');
      t(tree(node));

      expect(node.properties.src).toBe(`${baseWithFile}/img/foo.png`);
    });

    it('should leave absolute and special srcs untouched even with file set', () => {
      const t = rehypeRewriteAssetPaths({ assetBaseUrl: baseWithFile, file: 'examples/azure.md' });
      const inputs = [
        'https://example.com/logo.png',
        'http://example.com/logo.png',
        '//example.com/logo.png',
        '/absolute.png',
        'data:image/png;base64,iVBORw0KGgo=',
        'blob:http://localhost:3000/abc',
      ];

      for (const src of inputs) {
        const node = img(src);
        t(tree(node));
        expect(node.properties.src).toBe(src);
      }
    });

    it('should handle a deeply nested file path', () => {
      const t = rehypeRewriteAssetPaths({ assetBaseUrl: baseWithFile, file: 'a/b/c/page.md' });
      const node = img('img/foo.png');
      t(tree(node));

      expect(node.properties.src).toBe(`${baseWithFile}/a/b/c/img/foo.png`);
    });

    it('should handle assetBaseUrl with a trailing slash', () => {
      const t = rehypeRewriteAssetPaths({ assetBaseUrl: baseWithFile + '/', file: 'examples/azure.md' });
      const node = img('img/foo.png');
      t(tree(node));

      expect(node.properties.src).toBe(`${baseWithFile}/examples/img/foo.png`);
    });

    it('should tolerate a leading-slash file (normalized away)', () => {
      const t = rehypeRewriteAssetPaths({ assetBaseUrl: baseWithFile, file: '/examples/azure.md' });
      const node = img('img/foo.png');
      t(tree(node));

      expect(node.properties.src).toBe(`${baseWithFile}/examples/img/foo.png`);
    });

    it('should tolerate Windows-style backslash separators in file', () => {
      const t = rehypeRewriteAssetPaths({ assetBaseUrl: baseWithFile, file: 'examples\\azure.md' });
      const node = img('img/foo.png');
      t(tree(node));

      expect(node.properties.src).toBe(`${baseWithFile}/examples/img/foo.png`);
    });

    it('should tolerate mixed slashes in file', () => {
      const t = rehypeRewriteAssetPaths({ assetBaseUrl: baseWithFile, file: 'a\\b/c/page.md' });
      const node = img('img/foo.png');
      t(tree(node));

      expect(node.properties.src).toBe(`${baseWithFile}/a/b/c/img/foo.png`);
    });
  });

  describe('skip behavior for non-relative srcs', () => {
    const t = rehypeRewriteAssetPaths({ assetBaseUrl: 'https://cdn.example.com/docs', file: 'examples/azure.md' });

    it.each([
      'mailto:hello@example.com',
      'ftp://files.example.com/x.png',
      'irc://example.com',
      'tel:+1234567890',
      'javascript:alert(1)',
    ])('should leave %s untouched', (src) => {
      const node = img(src);
      t(tree(node));
      expect(node.properties.src).toBe(src);
    });
  });

  describe('protocol-relative assetBaseUrl', () => {
    it('should throw when assetBaseUrl is protocol-relative', () => {
      expect(() => rehypeRewriteAssetPaths({ assetBaseUrl: '//cdn.example.com/docs' })).toThrow(/protocol-relative/);
    });
  });

  describe('with root-relative assetBaseUrl (CLI use case)', () => {
    it('should resolve relative srcs against the doc file directory and produce a root-relative URL', () => {
      const t = rehypeRewriteAssetPaths({ assetBaseUrl: '/', file: 'examples/azure.md' });
      const node = img('img/foo.png');
      t(tree(node));

      expect(node.properties.src).toBe('/examples/img/foo.png');
    });

    it('should resolve from a root-relative subpath', () => {
      const t = rehypeRewriteAssetPaths({ assetBaseUrl: '/static/docs', file: 'examples/azure.md' });
      const node = img('img/foo.png');
      t(tree(node));

      expect(node.properties.src).toBe('/static/docs/examples/img/foo.png');
    });

    it('should leave non-relative srcs untouched', () => {
      const t = rehypeRewriteAssetPaths({ assetBaseUrl: '/', file: 'examples/azure.md' });
      const inputs = ['https://example.com/x.png', 'data:image/png;base64,iVBORw0KGgo=', '/already/absolute.png'];

      for (const src of inputs) {
        const node = img(src);
        t(tree(node));
        expect(node.properties.src).toBe(src);
      }
    });
  });
});
