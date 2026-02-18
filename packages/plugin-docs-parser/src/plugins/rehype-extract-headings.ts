import type { Root, Element } from 'hast';
import type { VFile } from 'vfile';
import { visit } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';
import type { Heading } from '../types.js';

declare module 'vfile' {
  interface DataMap {
    headings: Heading[];
  }
}

/**
 * Rehype plugin that extracts h2 and h3 headings from the tree.
 * Collected headings are stored on `vfile.data.headings`.
 */
export function rehypeExtractHeadings() {
  return (tree: Root, vfile: VFile) => {
    const headings: Heading[] = [];

    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'h2' && node.tagName !== 'h3') {
        return;
      }

      const id = node.properties?.id;
      if (typeof id !== 'string') {
        return;
      }

      headings.push({
        level: node.tagName === 'h2' ? 2 : 3,
        id,
        text: toString(node),
      });
    });

    vfile.data.headings = headings;
  };
}
