import type { Root, Element, ElementContent } from 'hast';
import { visit } from 'unist-util-visit';

function isWhitespace(node: ElementContent): boolean {
  return node.type === 'text' && node.value.trim() === '';
}

function onlyChild(node: Element): ElementContent | undefined {
  const children = node.children.filter((child) => !isWhitespace(child));
  return children.length === 1 ? children[0] : undefined;
}

// the image a paragraph holds on its own, either bare or wrapped in a single link
function findLoneImage(paragraph: Element): { image: Element; content: Element } | undefined {
  const child = onlyChild(paragraph);
  if (child?.type !== 'element') {
    return undefined;
  }
  if (child.tagName === 'img') {
    return { image: child, content: child };
  }
  const linked = child.tagName === 'a' ? onlyChild(child) : undefined;
  if (linked?.type === 'element' && linked.tagName === 'img') {
    return { image: linked, content: child };
  }
  return undefined;
}

/**
 * Rehype plugin that turns an image with a title, alone in its paragraph, into a
 * `<figure>` with the title as its `<figcaption>`. Other images are left untouched.
 */
export function rehypeFigure() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'p') {
        return;
      }

      const lone = findLoneImage(node);
      const caption = lone?.image.properties?.title;
      if (!lone || typeof caption !== 'string' || caption.trim() === '') {
        return;
      }

      delete lone.image.properties.title;

      node.tagName = 'figure';
      node.properties = {};
      node.children = [
        lone.content,
        { type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: caption }] },
      ];
    });
  };
}
