import type { Root, Element, ElementContent } from 'hast';
import { visit } from 'unist-util-visit';

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com']);

/**
 * Returns the video id of a YouTube watch, youtu.be, embed or Shorts URL, or undefined for any other URL
 * or an id that isn't 11 characters.
 */
export function getYouTubeVideoId(href: string): string | undefined {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return undefined;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return undefined;
  }

  let id: string | null | undefined;
  if (url.hostname === 'youtu.be') {
    id = url.pathname.slice(1);
  } else if (YOUTUBE_HOSTS.has(url.hostname)) {
    if (url.pathname === '/watch') {
      id = url.searchParams.get('v');
    } else {
      id = url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)\/?$/)?.[1];
    }
  }

  return id && VIDEO_ID_RE.test(id) ? id : undefined;
}

function getText(node: ElementContent): string {
  if (node.type === 'text') {
    return node.value;
  }
  return node.type === 'element' ? node.children.map(getText).join('') : '';
}

function hasImage(node: ElementContent): boolean {
  return node.type === 'element' && (node.tagName === 'img' || node.children.some(hasImage));
}

function isBlank(node: ElementContent): boolean {
  return node.type === 'text' && node.value.trim() === '';
}

/**
 * Rehype plugin that turns a paragraph holding only a YouTube link into
 * `<div class="youtube-embed" data-video-id="ID"><a href="...">Title</a></div>`.
 * The link stays inside as the fallback for renderers that don't build a player. A link
 * inside a sentence or a list, or to any other site, is left untouched.
 */
export function rehypeYouTube() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, _index, parent) => {
      // loose list items wrap their text in a paragraph, but links in a list should stay links
      if (node.tagName !== 'p' || (parent?.type === 'element' && parent.tagName === 'li')) {
        return;
      }

      const children = node.children.filter((child) => !isBlank(child));
      const link = children[0];
      if (children.length !== 1 || link.type !== 'element' || link.tagName !== 'a') {
        return;
      }

      if (hasImage(link)) {
        return;
      }

      const href = link.properties?.href;
      const id = typeof href === 'string' ? getYouTubeVideoId(href) : undefined;
      if (!id) {
        return;
      }

      const text = getText(link).trim();
      const title = text === '' || /^(?:https?:\/\/|www\.)/i.test(text) ? 'Watch on YouTube' : text;

      node.tagName = 'div';
      node.properties = { className: ['youtube-embed'], dataVideoId: id };
      node.children = [
        {
          type: 'element',
          tagName: 'a',
          properties: { href: `https://www.youtube.com/watch?v=${id}` },
          children: [{ type: 'text', value: title }],
        },
      ];
    });
  };
}
