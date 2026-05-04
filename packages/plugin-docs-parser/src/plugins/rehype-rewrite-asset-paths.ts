import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

export interface RewriteAssetPathsOptions {
  /**
   * Base URL for resolving relative image/asset paths.
   * Must be an absolute URL (e.g. `"https://cdn.example.com/foo/docs"`) or a root-relative path
   * (e.g. `"/"` or `"/static/docs"`). Anything else will throw from the URL constructor.
   */
  assetBaseUrl: string;

  /**
   * Path to the doc file relative to the docs root, forward-slash separated, no leading slash
   * (e.g. `"examples/azure.md"`). Pass `Page.file` from the manifest. When set, relative srcs
   * are resolved from the doc file's directory rather than from the docs root. When omitted,
   * relative srcs are resolved from `assetBaseUrl` (legacy behavior).
   */
  file?: string;
}

// synthetic origin used to coerce root-relative bases into a fully-qualified URL the URL
// constructor can resolve against. stripped from the result before returning.
const SYNTHETIC_ORIGIN = 'https://_resolver_.local';

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : value + '/';
}

function resolveSrc(src: string, assetBaseUrl: string, file: string | undefined): string {
  const baseWithSlash = ensureTrailingSlash(assetBaseUrl);
  const isAbs = isAbsoluteHttpUrl(assetBaseUrl);
  const fullBase = isAbs ? new URL(baseWithSlash) : new URL(baseWithSlash, SYNTHETIC_ORIGIN);

  // resolve relative to the doc file's directory if `file` was provided
  let dirBase = fullBase;
  if (file) {
    const lastSlash = file.lastIndexOf('/');
    if (lastSlash >= 0) {
      dirBase = new URL(file.slice(0, lastSlash + 1), fullBase);
    }
  }

  const resolved = new URL(src, dirBase);

  if (isAbs) {
    return resolved.toString();
  }
  // root-relative input: strip the synthetic origin
  return resolved.pathname + resolved.search + resolved.hash;
}

/**
 * Rehype plugin that rewrites relative image `src` attributes to absolute (or root-relative)
 * URLs, using URL-style resolution semantics.
 *
 * - `./foo` and `../foo` are normalized
 * - `data:`, `blob:`, protocol (`http://`, `https://`), protocol-relative (`//`) and
 *   root-relative (`/`) srcs are left untouched
 * - When `file` is provided, relative srcs resolve from the doc file's directory; otherwise
 *   they resolve from `assetBaseUrl`
 */
export function rehypeRewriteAssetPaths(options: RewriteAssetPathsOptions) {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img') {
        return;
      }

      const src = node.properties?.src;
      if (typeof src !== 'string') {
        return;
      }

      // skip absolute, protocol-relative, data, blob and root-relative URLs
      if (
        src.startsWith('http://') ||
        src.startsWith('https://') ||
        src.startsWith('//') ||
        src.startsWith('data:') ||
        src.startsWith('blob:') ||
        src.startsWith('/')
      ) {
        return;
      }

      node.properties.src = resolveSrc(src, options.assetBaseUrl, options.file);
    });
  };
}
