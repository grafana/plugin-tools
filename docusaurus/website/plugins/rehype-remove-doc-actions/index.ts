import type { Element, Root, RootContent } from 'hast';

const isDocActions = (node: RootContent) =>
  node.type === 'element' && ([] as unknown[]).concat(node.properties?.className ?? []).includes('doc-actions');

// Drops the "View as Markdown" link from the markdown files the llms-txt plugin generates,
// the link is only useful on the HTML page.
export default function rehypeRemoveDocActions() {
  const strip = (node: Root | Element) => {
    node.children = node.children.filter((child) => !isDocActions(child)) as typeof node.children;
    node.children.forEach((child) => child.type === 'element' && strip(child));
  };
  return (tree: Root) => strip(tree);
}
