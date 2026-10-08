import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';
import type { Node } from 'unist';

// headings ranked h1-h6
const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

// the id remark-rehype gives the hidden footnotes heading, which footnote references point at
const FOOTNOTE_LABEL_ID = 'footnote-label';

function nodeToString(node: Node): string {
  if ('value' in node) {
    return node.value as string;
  }
  if ('children' in node) {
    return (node.children as Node[]).map(nodeToString).join('');
  }
  return '';
}

// lowercases, strips non-word chars (preserving hyphens), collapses whitespace to hyphens.
// matches github-slugger behaviour for ASCII content.
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s]+/g, '-');
}

/**
 * Rehype plugin that adds `id` attributes to heading elements.
 * Duplicate headings get a numeric suffix (-1, -2, ...).
 * An existing id, such as one from raw HTML, is replaced, except the footnotes heading's.
 */
export function rehypeSlug() {
  return (tree: Root) => {
    const seen = new Map<string, number>();

    visit(tree, 'element', (node: Element) => {
      if (!HEADING_TAGS.has(node.tagName) || node.properties?.id === FOOTNOTE_LABEL_ID) {
        return;
      }

      node.properties = node.properties ?? {};
      delete node.properties.id;
      const base = slugify(nodeToString(node));
      // skip if the heading produced no usable slug (e.g. emoji or punctuation only)
      if (!base) {
        return;
      }

      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);

      node.properties.id = count === 0 ? base : `${base}-${count}`;
    });
  };
}
