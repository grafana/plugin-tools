import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

const VIDEO_SRC_RE = /\.(?:mp4|webm)(?:[?#].*)?$/i;

/**
 * Rehype plugin that turns an image whose src is an mp4 or webm file into a `<video>` with
 * controls and no autoplay. The alt text becomes the label and the markdown title is kept.
 * A link to the file stays inside as the fallback for browsers that can't play it.
 */
export function rehypeVideo() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img') {
        return;
      }

      const { src, alt, title } = node.properties ?? {};
      if (typeof src !== 'string' || !VIDEO_SRC_RE.test(src)) {
        return;
      }

      const label = typeof alt === 'string' && alt !== '' ? alt : 'Video';

      node.tagName = 'video';
      node.properties = {
        src,
        controls: true,
        muted: true,
        playsInline: true,
        preload: 'metadata',
        ...(typeof alt === 'string' && alt !== '' ? { ariaLabel: alt } : {}),
        ...(typeof title === 'string' ? { title } : {}),
      };
      node.children = [
        {
          type: 'element',
          tagName: 'a',
          properties: { href: src },
          children: [{ type: 'text', value: label }],
        },
      ];
    });
  };
}
