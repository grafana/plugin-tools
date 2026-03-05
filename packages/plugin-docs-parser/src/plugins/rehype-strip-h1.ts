import type { Root, Element, Parent } from 'hast';
import { visit, SKIP } from 'unist-util-visit';

/**
 * Rehype plugin that removes h1 elements from the tree.
 * Page titles come from frontmatter and are rendered by the platform layout.
 */
export function rehypeStripH1() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent: Parent | null) => {
      if (node.tagName === 'h1' && parent !== null && index !== undefined) {
        parent.children.splice(index, 1);
        return [SKIP, index];
      }
      return;
    });
  };
}
