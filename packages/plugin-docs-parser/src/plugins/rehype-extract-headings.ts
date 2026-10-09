import type { Root, Element } from 'hast';
import type { Node } from 'unist';
import type { VFile } from 'vfile';
import { CONTINUE, SKIP, visit } from 'unist-util-visit';
import type { Heading } from '../types.js';

function hastToString(node: Node): string {
  if ('value' in node) {
    return node.value as string;
  }
  if ('children' in node) {
    return (node.children as Node[]).map(hastToString).join('');
  }
  return '';
}

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
      // headings in collapsed content and the hidden "Footnotes" heading from remark-gfm aren't in the TOC
      if (node.tagName === 'details' || (node.tagName === 'section' && node.properties?.dataFootnotes !== undefined)) {
        return SKIP;
      }

      const id = node.properties?.id;
      if ((node.tagName === 'h2' || node.tagName === 'h3') && typeof id === 'string') {
        headings.push({
          level: node.tagName === 'h2' ? 2 : 3,
          id,
          text: hastToString(node),
        });
      }
      return CONTINUE;
    });

    vfile.data.headings = headings;
  };
}
