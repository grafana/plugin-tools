import { describe, it, expect } from 'vitest';
import { toHtml } from 'hast-util-to-html';
import type { Root, Element, Text } from 'hast';
import { rehypeStripH1 } from './rehype-strip-h1.js';

function el(tag: string, text: string): Element {
  const child: Text = { type: 'text', value: text };
  return { type: 'element', tagName: tag, properties: {}, children: [child] };
}

function tree(...children: Element[]): Root {
  return { type: 'root', children };
}

describe('rehypeStripH1', () => {
  const transform = rehypeStripH1();

  it('should remove an h1 element', () => {
    const root = tree(el('h1', 'Page Title'));
    transform(root);

    expect(root.children).toHaveLength(0);
  });

  it('should remove h1 but keep other elements', () => {
    const root = tree(el('h1', 'Title'), el('h2', 'Section'), el('p', 'Body'));
    transform(root);

    expect(root.children).toHaveLength(2);
    expect(toHtml(root)).toContain('<h2>');
    expect(toHtml(root)).toContain('<p>');
    expect(toHtml(root)).not.toContain('<h1');
  });

  it('should remove multiple h1 elements', () => {
    const root = tree(el('h1', 'First'), el('p', 'Middle'), el('h1', 'Second'));
    transform(root);

    expect(root.children).toHaveLength(1);
    expect(toHtml(root)).toContain('<p>');
    expect(toHtml(root)).not.toContain('<h1');
  });

  it('should leave h2 and lower headings untouched', () => {
    const root = tree(el('h2', 'Section'), el('h3', 'Subsection'), el('h4', 'Deep'));
    transform(root);

    expect(root.children).toHaveLength(3);
  });

  it('should be a no-op on a tree with no h1', () => {
    const root = tree(el('p', 'Just a paragraph.'));
    transform(root);

    expect(root.children).toHaveLength(1);
  });

  it('should handle an empty tree', () => {
    const root = tree();
    transform(root);

    expect(root.children).toHaveLength(0);
  });
});
