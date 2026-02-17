import { describe, it, expect } from 'vitest';
import type { Root, Element, Text } from 'hast';
import { rehypeRewriteDocLinks } from './rehype-rewrite-doc-links.js';

function link(href: string, text = 'link'): Element {
  const child: Text = { type: 'text', value: text };
  return { type: 'element', tagName: 'a', properties: { href }, children: [child] };
}

function tree(...children: Element[]): Root {
  return { type: 'root', children };
}

describe('rehypeRewriteDocLinks', () => {
  const transform = rehypeRewriteDocLinks();

  it('should strip .md extension', () => {
    const node = link('installation.md');
    transform(tree(node));

    expect(node.properties.href).toBe('installation');
  });

  it('should preserve fragments when stripping .md', () => {
    const node = link('configuration.md#auth');
    transform(tree(node));

    expect(node.properties.href).toBe('configuration#auth');
  });

  it('should handle relative paths with .md', () => {
    const node = link('../getting-started/setup.md');
    transform(tree(node));

    expect(node.properties.href).toBe('../getting-started/setup');
  });

  it('should handle relative paths with .md and fragment', () => {
    const node = link('./guide.md#intro');
    transform(tree(node));

    expect(node.properties.href).toBe('./guide#intro');
  });

  it('should leave https URLs untouched', () => {
    const node = link('https://grafana.com/docs/index.md');
    transform(tree(node));

    expect(node.properties.href).toBe('https://grafana.com/docs/index.md');
  });

  it('should leave http URLs untouched', () => {
    const node = link('http://grafana.com/docs/index.md');
    transform(tree(node));

    expect(node.properties.href).toBe('http://grafana.com/docs/index.md');
  });

  it('should leave protocol-relative URLs untouched', () => {
    const node = link('//grafana.com/docs/index.md');
    transform(tree(node));

    expect(node.properties.href).toBe('//grafana.com/docs/index.md');
  });

  it('should leave mailto links untouched', () => {
    const node = link('mailto:support@example.md');
    transform(tree(node));

    expect(node.properties.href).toBe('mailto:support@example.md');
  });

  it('should leave non-.md links untouched', () => {
    const node = link('overview');
    transform(tree(node));

    expect(node.properties.href).toBe('overview');
  });

  it('should leave fragment-only links untouched', () => {
    const node = link('#section');
    transform(tree(node));

    expect(node.properties.href).toBe('#section');
  });

  it('should not touch non-anchor elements', () => {
    const node: Element = {
      type: 'element',
      tagName: 'img',
      properties: { src: 'file.md' },
      children: [],
    };
    transform(tree(node));

    expect(node.properties.src).toBe('file.md');
  });
});
