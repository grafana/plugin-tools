import type { Heading, Page } from '@grafana/plugin-docs-parser';

// slug of the page served at the docs root. matches catalog-website's DOCS_INDEX_SLUG so authors
// see the same layout locally as on grafana.com.
export const DOCS_INDEX_SLUG = 'index';

// any `scheme:` url — http:, mailto:, data:, tel: … — is the author's own absolute target
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;

// synthetic origin used only to borrow the URL parser's relative-path resolution ('../' etc.)
const RESOLVER_ORIGIN = 'https://resolver.invalid/';

/** The docs root path (base for all doc urls). */
export function docsBasePath(): string {
  return '/docs';
}

/** Preview href for a manifest page. The index page lives at the docs root, not at `/docs/index`. */
export function docPageHref(pageSlug: string, docsBase: string = docsBasePath()): string {
  if (pageSlug === DOCS_INDEX_SLUG) {
    return docsBase;
  }
  return `${docsBase}/${encodeDocSlug(pageSlug)}`;
}

/** Percent-encodes a manifest slug's segments while leaving the `/` separators intact. */
export function encodeDocSlug(pageSlug: string): string {
  return pageSlug.split('/').map(encodeURIComponent).join('/');
}

/** Strip a trailing slash from a url path. */
export function stripTrailingSlash(path: string): string {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

/** Depth-first lookup by manifest slug. */
export function findDocPage(pages: Page[], slug: string): Page | null {
  for (const page of pages) {
    if (page.slug === slug) {
      return page;
    }
    const found = page.children ? findDocPage(page.children, slug) : null;
    if (found) {
      return found;
    }
  }
  return null;
}

/**
 * The page served at `/docs` — the docs landing page the author writes as `index.md`.
 * Null when the manifest has none, in which case the Documentation tab is hidden.
 */
export function docsLandingPage(pages: Page[]): Page | null {
  const index = findDocPage(pages, DOCS_INDEX_SLUG);
  return index?.file ? index : null;
}

/**
 * First node in a subtree backed by a real file. A directory without an `index.md` yields a
 * category node with `file: ''` — the nav points at its first real descendant instead.
 */
export function firstRenderablePage(page: Page): Page | null {
  if (page.file) {
    return page;
  }
  for (const child of page.children ?? []) {
    const found = firstRenderablePage(child);
    if (found) {
      return found;
    }
  }
  return null;
}

/** Chain of manifest nodes from the docs root down to `pageSlug`, inclusive. */
export function findDocAncestors(pages: Page[], pageSlug: string): Page[] {
  const walk = (nodes: Page[], trail: Page[]): Page[] | null => {
    for (const node of nodes) {
      const next = [...trail, node];
      if (node.slug === pageSlug) {
        return next;
      }
      const found = node.children ? walk(node.children, next) : null;
      if (found) {
        return found;
      }
    }
    return null;
  };

  return walk(pages, []) ?? [];
}

export interface NavHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface NavItem {
  label: string;
  href: string;
  slug: string;
  children?: NavItem[];
}

export interface DocsNav {
  items: NavItem[];
  /** Build-time h2/h3 per page, keyed by the page's href with any trailing slash stripped. */
  headingsByHref: Record<string, NavHeading[]>;
}

/**
 * Maps a manifest page tree onto the sidebar nav shape used by catalog-website.
 *
 * A category node (a directory without an `index.md`) borrows its first renderable descendant's
 * href, and that descendant is pruned from the category's children so nothing appears twice.
 */
export function toDocsNav(pages: Page[], docsBase: string = docsBasePath()): DocsNav {
  const headingsByHref: Record<string, NavHeading[]> = {};

  const toItems = (nodes: Page[]): NavItem[] =>
    nodes.flatMap((page) => {
      const target = firstRenderablePage(page);
      if (!target) {
        return [];
      }

      const href = docPageHref(target.slug, docsBase);
      const headings = navHeadings(target);
      if (headings.length > 0) {
        headingsByHref[stripTrailingSlash(href)] = headings;
      }

      const children = page.file ? page.children : pruneNode(page.children, target);
      const childItems = children?.length ? toItems(children) : [];

      return [
        {
          label: page.title,
          href,
          slug: target.slug,
          children: childItems.length ? childItems : undefined,
        },
      ];
    });

  return { items: toItems(pages), headingsByHref };
}

function pruneNode(nodes: Page[] | undefined, remove: Page): Page[] | undefined {
  return nodes?.flatMap((node) => (node === remove ? [] : [{ ...node, children: pruneNode(node.children, remove) }]));
}

function navHeadings(page: Page): NavHeading[] {
  return (page.headings ?? [])
    .filter((heading): heading is Heading & { level: 2 | 3 } => heading.level === 2 || heading.level === 3)
    .map((heading) => ({ id: heading.id, text: heading.text, level: heading.level }));
}

/**
 * Turns a relative doc link into a preview href, matching catalog-website.
 *
 * The parser strips `.md` but leaves the link relative ('permissions', '../troubleshooting'), so
 * it is resolved against the current file's directory and mapped through the manifest — a page's
 * URL comes from its `slug`, which frontmatter can override.
 */
export function resolveDocHref(href: string, currentFile: string, pages: Page[], docsBase: string): string {
  if (!href || href.startsWith('#') || href.startsWith('//') || href.startsWith('/') || SCHEME_RE.test(href)) {
    return href;
  }

  const [, path, suffix] = /^([^#?]*)([\s\S]*)$/.exec(href) ?? [];
  if (!path) {
    return href;
  }

  const resolved = resolveRelativePath(path, currentFile);
  if (resolved === null) {
    return href;
  }

  const page = findPageByFile(pages, resolved);
  const base = page ? docPageHref(page.slug, docsBase) : resolved ? `${docsBase}/${encodeDocSlug(resolved)}` : docsBase;
  return `${base}${suffix}`;
}

function resolveRelativePath(path: string, currentFile: string): string | null {
  const dir = currentFile.includes('/') ? currentFile.replace(/\/[^/]*$/, '/') : '';
  try {
    const url = new URL(path, new URL(dir, RESOLVER_ORIGIN));
    const decoded = decodeURIComponent(url.pathname).replace(/^\//, '').replace(/\/$/, '');
    if (decoded.split('/').some((segment) => segment === '.' || segment === '..')) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function findPageByFile(pages: Page[], path: string): Page | null {
  const candidates = [`${path}.md`, `${path}/index.md`];
  for (const page of pages) {
    if (page.file && candidates.includes(page.file)) {
      return page;
    }
    const found = page.children ? findPageByFile(page.children, path) : null;
    if (found) {
      return found;
    }
  }
  return null;
}
