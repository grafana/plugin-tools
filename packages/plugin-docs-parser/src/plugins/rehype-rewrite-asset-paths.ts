import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

export interface RewriteAssetPathsOptions {
  /**
   * Base URL for resolving relative image/asset paths.
   * Must be an absolute URL (e.g. `"https://cdn.example.com/foo/docs"`) or a root-relative path
   * (e.g. `"/"` or `"/static/docs"`). Protocol-relative bases (`//host/...`) are not supported
   * and will throw.
   */
  assetBaseUrl: string;

  /**
   * Path to the doc file relative to the docs root (e.g. `"examples/azure.md"`). Pass
   * `Page.file` from the manifest. When set, relative srcs are resolved from the doc file's
   * directory rather than from the docs root. When omitted, relative srcs are resolved from
   * `assetBaseUrl` (legacy behavior).
   *
   * Forward-slash separation is the documented format, but OS-specific separators (`\\`) and
   * a leading `/` are tolerated and normalized away so callers can forward `node:path` output
   * without a manual cleanup step.
   */
  file?: string;
}

// synthetic origin used to coerce root-relative bases into a fully-qualified URL the URL
// constructor can resolve against. stripped from the result before returning.
const SYNTHETIC_ORIGIN = 'https://_resolver_.local';

// matches any RFC 3986 scheme-prefixed URL (http:, https:, data:, blob:, mailto:, ftp:, ...).
// used to skip srcs that are already absolute regardless of scheme.
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : value + '/';
}

function normalizeFile(file: string): string {
  // tolerate node:path output on Windows (`examples\azure.md`) and a stray leading slash
  return file.replace(/\\/g, '/').replace(/^\/+/, '');
}

function resolveSrc(src: string, assetBaseUrl: string, file: string | undefined): string {
  const baseWithSlash = ensureTrailingSlash(assetBaseUrl);
  const isAbs = isAbsoluteHttpUrl(assetBaseUrl);
  const fullBase = isAbs ? new URL(baseWithSlash) : new URL(baseWithSlash, SYNTHETIC_ORIGIN);

  // resolve relative to the doc file's directory if `file` was provided
  let dirBase = fullBase;
  if (file) {
    const normalized = normalizeFile(file);
    const lastSlash = normalized.lastIndexOf('/');
    if (lastSlash >= 0) {
      dirBase = new URL(normalized.slice(0, lastSlash + 1), fullBase);
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
 * - any `scheme:` URL (`http:`, `https:`, `data:`, `blob:`, `mailto:`, `ftp:`, ...),
 *   protocol-relative (`//`) and root-relative (`/`) srcs are left untouched
 * - When `file` is provided, relative srcs resolve from the doc file's directory; otherwise
 *   they resolve from `assetBaseUrl`
 */
export function rehypeRewriteAssetPaths(options: RewriteAssetPathsOptions) {
  if (options.assetBaseUrl.startsWith('//')) {
    throw new TypeError(
      `assetBaseUrl must be an absolute URL or a root-relative path; protocol-relative URLs are not supported (got: ${options.assetBaseUrl})`
    );
  }

  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img') {
        return;
      }

      const src = node.properties?.src;
      if (typeof src !== 'string') {
        return;
      }

      // skip any already-absolute src: schemed (http:, data:, mailto:, ...), protocol-relative, root-relative
      if (SCHEME_RE.test(src) || src.startsWith('//') || src.startsWith('/')) {
        return;
      }

      node.properties.src = resolveSrc(src, options.assetBaseUrl, options.file);
    });
  };
}
