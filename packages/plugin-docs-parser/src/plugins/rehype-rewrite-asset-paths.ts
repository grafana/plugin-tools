import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

export interface RewriteAssetPathsOptions {
  /** Base URL for resolving relative image/asset paths to absolute CDN URLs. */
  assetBaseUrl: string;
}

/**
 * Rehype plugin that rewrites relative image `src` attributes to absolute CDN URLs.
 */
export function rehypeRewriteAssetPaths(options: RewriteAssetPathsOptions) {
  const base = options.assetBaseUrl.replace(/\/$/, '');

  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img') {
        return;
      }

      const src = node.properties?.src;
      if (typeof src !== 'string') {
        return;
      }

      // skip absolute and protocol-relative URLs
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
        return;
      }

      node.properties.src = `${base}/${src}`;
    });
  };
}
