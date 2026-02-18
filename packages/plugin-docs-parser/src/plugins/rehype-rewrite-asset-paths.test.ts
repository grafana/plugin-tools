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
});
