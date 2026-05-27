import { describe, it, expect } from 'vitest';
import type { Root, Element, Text, Properties } from 'hast';
import { rehypeSlug } from './rehype-slug.js';

function el(tag: string, text: string, properties: Properties = {}): Element {
  const child: Text = { type: 'text', value: text };
  return { type: 'element', tagName: tag, properties, children: [child] };
}

function tree(...children: Element[]): Root {
  return { type: 'root', children };
}

function getEl(root: Root, index: number): Element {
  const child = root.children[index];
  if (child.type !== 'element') {
    throw new Error(`expected element at index ${index}, got ${child.type}`);
  }
  return child;
}

describe('rehypeSlug', () => {
  const transform = rehypeSlug();

  it('should add id attributes to headings', () => {
    const root = tree(el('h2', 'Getting Started'), el('h3', 'Prerequisites'));
    transform(root);

    expect(getEl(root, 0).properties).toMatchObject({ id: 'getting-started' });
    expect(getEl(root, 1).properties).toMatchObject({ id: 'prerequisites' });
  });

  it('should lowercase and strip punctuation when slugifying', () => {
    const root = tree(el('h2', "What's New?"));
    transform(root);

    expect(getEl(root, 0).properties).toMatchObject({ id: 'whats-new' });
  });

  it('should suffix duplicate headings with -1, -2, ...', () => {
    const root = tree(el('h2', 'Setup'), el('h2', 'Setup'), el('h2', 'Setup'));
    transform(root);

    expect(getEl(root, 0).properties).toMatchObject({ id: 'setup' });
    expect(getEl(root, 1).properties).toMatchObject({ id: 'setup-1' });
    expect(getEl(root, 2).properties).toMatchObject({ id: 'setup-2' });
  });

  it('should leave pre-existing ids untouched', () => {
    const root = tree(el('h2', 'Setup', { id: 'custom-anchor' }));
    transform(root);

    expect(getEl(root, 0).properties).toMatchObject({ id: 'custom-anchor' });
  });

  it('should not count pre-existing ids toward dedupe', () => {
    const root = tree(el('h2', 'Setup', { id: 'setup' }), el('h2', 'Setup'));
    transform(root);

    // the second heading still gets the unsuffixed slug because the visitor
    // only tracks ids it has assigned itself
    expect(getEl(root, 1).properties).toMatchObject({ id: 'setup' });
  });

  it('should skip headings that slugify to empty (emoji or punctuation only)', () => {
    const root = tree(el('h2', '🎉'), el('h2', '!!!'));
    transform(root);

    expect(getEl(root, 0).properties).not.toHaveProperty('id');
    expect(getEl(root, 1).properties).not.toHaveProperty('id');
  });

  it('should slugify across all h1-h6 levels', () => {
    const root = tree(el('h1', 'Title'), el('h4', 'Deep'), el('h6', 'Deeper'));
    transform(root);

    expect(getEl(root, 0).properties).toMatchObject({ id: 'title' });
    expect(getEl(root, 1).properties).toMatchObject({ id: 'deep' });
    expect(getEl(root, 2).properties).toMatchObject({ id: 'deeper' });
  });

  it('should ignore non-heading elements', () => {
    const root = tree(el('p', 'A paragraph'), el('div', 'A div'));
    transform(root);

    expect(getEl(root, 0).properties).not.toHaveProperty('id');
    expect(getEl(root, 1).properties).not.toHaveProperty('id');
  });

  it('should concatenate text from nested children', () => {
    const inner: Element = {
      type: 'element',
      tagName: 'code',
      properties: {},
      children: [{ type: 'text', value: 'parseMarkdown' } as Text],
    };
    const heading: Element = {
      type: 'element',
      tagName: 'h2',
      properties: {},
      children: [{ type: 'text', value: 'The ' } as Text, inner, { type: 'text', value: ' function' } as Text],
    };
    const root = tree(heading);
    transform(root);

    expect(getEl(root, 0).properties).toMatchObject({ id: 'the-parsemarkdown-function' });
  });

  it('should handle an empty tree', () => {
    const root = tree();
    transform(root);

    expect(root.children).toHaveLength(0);
  });
});
