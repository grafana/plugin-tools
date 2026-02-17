import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * Rehype plugin that rewrites relative `.md` links to clean URLs.
 * Strips the `.md` extension and preserves fragments.
 *
 * Examples:
 *   `installation.md` → `installation`
 *   `configuration.md#auth` → `configuration#auth`
 *   `../getting-started/setup.md` → `../getting-started/setup`
 */
const mdPattern = /^(.*?)\.md(#.*)?$/;

export function rehypeRewriteDocLinks() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'a') {
        return;
      }

      const href = node.properties?.href;
      if (typeof href !== 'string') {
        return;
      }

      // skip absolute, protocol-relative and mailto links
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('//') ||
        href.startsWith('mailto:')
      ) {
        return;
      }

      // strip .md extension, preserving any fragment
      const match = href.match(mdPattern);
      if (match) {
        node.properties.href = `${match[1]}${match[2] || ''}`;
      }
    });
  };
}
