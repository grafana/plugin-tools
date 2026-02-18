import { describe, it, expect } from 'vitest';
import { VFile } from 'vfile';
import type { Root, Element, Text } from 'hast';
import { rehypeExtractHeadings } from './rehype-extract-headings.js';

function heading(level: 2 | 3, id: string, text: string): Element {
  const child: Text = { type: 'text', value: text };
  return {
    type: 'element',
    tagName: `h${level}`,
    properties: { id },
    children: [child],
  };
}

function tree(...children: Element[]): Root {
  return { type: 'root', children };
}

describe('rehypeExtractHeadings', () => {
  const transform = rehypeExtractHeadings();

  it('should extract h2 headings', () => {
    const vfile = new VFile();
    transform(tree(heading(2, 'intro', 'Introduction')), vfile);

    expect(vfile.data.headings).toEqual([{ level: 2, id: 'intro', text: 'Introduction' }]);
  });

  it('should extract h3 headings', () => {
    const vfile = new VFile();
    transform(tree(heading(3, 'details', 'Details')), vfile);

    expect(vfile.data.headings).toEqual([{ level: 3, id: 'details', text: 'Details' }]);
  });

  it('should extract multiple headings in order', () => {
    const vfile = new VFile();
    transform(tree(heading(2, 'first', 'First'), heading(3, 'second', 'Second'), heading(2, 'third', 'Third')), vfile);

    expect(vfile.data.headings).toEqual([
      { level: 2, id: 'first', text: 'First' },
      { level: 3, id: 'second', text: 'Second' },
      { level: 2, id: 'third', text: 'Third' },
    ]);
  });

  it('should ignore h1 headings', () => {
    const h1: Element = {
      type: 'element',
      tagName: 'h1',
      properties: { id: 'title' },
      children: [{ type: 'text', value: 'Title' }],
    };
    const vfile = new VFile();
    transform(tree(h1), vfile);

    expect(vfile.data.headings).toEqual([]);
  });

  it('should ignore h4+ headings', () => {
    const h4: Element = {
      type: 'element',
      tagName: 'h4',
      properties: { id: 'deep' },
      children: [{ type: 'text', value: 'Deep' }],
    };
    const vfile = new VFile();
    transform(tree(h4), vfile);

    expect(vfile.data.headings).toEqual([]);
  });

  it('should skip headings without an id', () => {
    const noId: Element = {
      type: 'element',
      tagName: 'h2',
      properties: {},
      children: [{ type: 'text', value: 'No ID' }],
    };
    const vfile = new VFile();
    transform(tree(noId), vfile);

    expect(vfile.data.headings).toEqual([]);
  });

  it('should extract text from nested inline elements', () => {
    const nested: Element = {
      type: 'element',
      tagName: 'h2',
      properties: { id: 'install' },
      children: [
        { type: 'text', value: 'Install the ' },
        {
          type: 'element',
          tagName: 'code',
          properties: {},
          children: [{ type: 'text', value: 'plugin' }],
        },
        { type: 'text', value: ' package' },
      ],
    };
    const vfile = new VFile();
    transform(tree(nested), vfile);

    expect(vfile.data.headings).toEqual([{ level: 2, id: 'install', text: 'Install the plugin package' }]);
  });

  it('should return empty array when no headings exist', () => {
    const p: Element = {
      type: 'element',
      tagName: 'p',
      properties: {},
      children: [{ type: 'text', value: 'Just a paragraph.' }],
    };
    const vfile = new VFile();
    transform(tree(p), vfile);

    expect(vfile.data.headings).toEqual([]);
  });
});
