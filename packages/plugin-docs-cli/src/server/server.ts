import express, { type Express, type Request, type Response } from 'express';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { watch } from 'chokidar';
import createDebug from 'debug';
import { marked } from 'marked';
import xss, { whiteList } from 'xss';
import Slugger from 'github-slugger';
import { parseMarkdown, type Manifest, type Page } from '@grafana/plugin-docs-parser';
import { toHtml } from 'hast-util-to-html';
import { scanDocsFolder } from '../scanner.js';
import { validate } from '../validation/engine.js';
import { formatResult } from '../validation/format.js';
import { allRules } from '../validation/rules/index.js';
import {
  docPageHref,
  docsBasePath,
  docsLandingPage,
  findDocAncestors,
  findDocPage,
  firstRenderablePage,
  resolveDocHref,
  stripTrailingSlash,
  toDocsNav,
  DOCS_INDEX_SLUG,
  type NavHeading,
  type NavItem,
} from './nav.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const debug = createDebug('plugin-docs-cli:server');

export interface ServerOptions {
  docsPath: string;
  readmePath?: string;
  port: number;
  liveReload?: boolean;
  pluginType?: string;
}

export interface Server {
  app: Express;
  close: () => Promise<void>;
}

interface Crumb {
  label: string;
  href?: string;
}

interface RenderNavItem extends NavItem {
  isActive: boolean;
  descendantActive: boolean;
  headings: NavHeading[];
  children?: RenderNavItem[];
}

/**
 * Starts a development server for previewing plugin documentation.
 *
 * @param options - Server configuration options
 * @returns Server instance with app and close method
 *
 * The layout mirrors catalog-website: an Overview tab renders the plugin README, a Documentation
 * tab renders the multi-page docs (`<docsPath>/index.md` at `/docs`, other pages at
 * `/docs/<slug>`), and the right rail shows either the README's headings or the docs nav tree with
 * the active page's h2/h3 nested underneath.
 */
export async function startServer(options: ServerOptions): Promise<Server> {
  const { docsPath, readmePath, port = 3001, liveReload = false, pluginType } = options;

  debug('Starting server with options: docsPath=%s, port=%d, liveReload=%s', docsPath, port, liveReload);

  const app = express();
  let lastModified = Date.now();

  // configure EJS
  app.set('view engine', 'ejs');
  app.set('views', join(__dirname, 'views'));

  // run validation in non-strict mode and log results without blocking. this reruns on every
  // save, so writing-style findings are collapsed to a single line - printing all of them would
  // bury the structural problems the author actually has to fix.
  const runValidation = async () => {
    try {
      const result = await validate({ docsPath, strict: false, pluginType }, allRules);
      const styleFindings = result.diagnostics.filter((d) => d.rule.startsWith('style-'));
      const rest = { ...result, diagnostics: result.diagnostics.filter((d) => !d.rule.startsWith('style-')) };

      if (rest.diagnostics.length > 0) {
        console.log(formatResult(rest));
      }
      if (styleFindings.length > 0) {
        const warnings = styleFindings.filter((d) => d.severity === 'warning').length;
        const suggestions = styleFindings.length - warnings;
        const parts: string[] = [];
        if (warnings > 0) {
          parts.push(`${warnings} writing-style warning${warnings === 1 ? '' : 's'}`);
        }
        if (suggestions > 0) {
          parts.push(`${suggestions} suggestion${suggestions === 1 ? '' : 's'}`);
        }
        console.log(`  ${parts.join(', ')} - run \`docs:validate\` to see them\n`);
      }
    } catch (error) {
      console.error('Validation failed:', error instanceof Error ? error.message : error);
    }
  };

  // scan filesystem and generate manifest; page content lives on each Page, not a separate map
  debug('Scanning docs folder: %s', docsPath);
  const scanned = await scanDocsFolder(docsPath);
  let manifest: Manifest = scanned.manifest;
  debug('Manifest generated with %d pages', manifest.pages.length);

  // validate on startup
  await runValidation();

  // watch markdown files under docsPath and, if present, the README, so both trigger reloads
  const watchPaths = [join(docsPath, '**/*.md')];
  if (readmePath) {
    watchPaths.push(readmePath);
  }
  const watcher = watch(watchPaths, {
    ignoreInitial: true,
  });
  debug('File watcher initialized for %O', watchPaths);

  const rescan = async (event: string, path: string) => {
    debug('File %s: %s', event, path);
    lastModified = Date.now();

    try {
      const rescanned = await scanDocsFolder(docsPath);
      manifest = rescanned.manifest;
    } catch (error) {
      console.error('Error re-scanning docs folder:', error);
    }

    await runValidation();
  };

  watcher.on('change', (p) => rescan('changed', p));
  watcher.on('add', (p) => rescan('added', p));
  watcher.on('unlink', (p) => rescan('removed', p));

  // serve docs assets (images) under /docs so they line up with the /docs/... page urls.
  // skip .md files so they're handled by the page route, not served raw.
  const docsStatic = express.static(docsPath, { index: false, redirect: false, dotfiles: 'ignore', extensions: [] });
  app.use('/docs', (req, res, next) => {
    if (req.path.endsWith('.md')) {
      return next();
    }
    docsStatic(req, res, next);
  });
  app.use('/styles', express.static(join(__dirname, 'styles')));

  // live reload endpoint (if enabled)
  if (liveReload) {
    app.get('/__reload__', (req: Request, res: Response) => {
      const clientTime = parseInt(req.query.t as string, 10) || 0;
      if (lastModified > clientTime) {
        res.status(205).send(); //signals reload
      } else {
        res.status(204).send(); // no changes
      }
    });
  }

  // Overview tab: render the plugin README with marked, matching how gcom stores it.
  app.get('/', async (_req: Request, res: Response) => {
    try {
      if (!readmePath) {
        res.status(200).render(
          'docs-layout',
          baseLayoutContext('Overview', 'overview', manifest, liveReload, {
            content:
              '<p class="preview-empty">No README found. Add <code>src/README.md</code> or <code>README.md</code> to the plugin project.</p>',
            onThisPage: [],
          })
        );
        return;
      }

      const raw = await readFile(readmePath, 'utf-8');
      const { html, headings } = renderReadme(raw);
      res.render(
        'docs-layout',
        baseLayoutContext('Overview', 'overview', manifest, liveReload, {
          content: html,
          onThisPage: headings,
        })
      );
    } catch (error) {
      console.error('Error rendering README:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Documentation tab: /docs is the landing page (index.md); /docs/<slug> is any other page.
  app.get(['/docs', '/docs/{*splat}'], async (req: Request, res: Response) => {
    try {
      const landing = docsLandingPage(manifest.pages);
      if (!landing) {
        res.status(404).send('No documentation available (missing root index.md).');
        return;
      }

      const splat = (req.params.splat as string[] | undefined) ?? [];
      const rawSlug = splat.join('/');
      const trimmed = rawSlug.replace(/^\/|\/$/g, '');

      // /docs/index has no url of its own; the landing lives at /docs.
      if (trimmed === DOCS_INDEX_SLUG) {
        res.status(404).send('Page not found');
        return;
      }

      const page = trimmed ? findDocPage(manifest.pages, trimmed) : landing;
      if (!page || !page.file) {
        res.status(404).send('Page not found');
        return;
      }

      // === undefined, not falsy: a frontmatter-only page has content '', which is real
      if (page.content === undefined) {
        res.status(404).send('File content not found');
        return;
      }

      // route through the parser's asset rewriting so local preview exercises the same
      // code path as production. assetBaseUrl '/docs/' produces srcs that the docs
      // express.static handler mounted at /docs serves unchanged.
      const docsBase = docsBasePath();
      const parsed = parseMarkdown(page.content, {
        assetBaseUrl: `${docsBase}/`,
        file: page.file,
      });
      rewriteHast(parsed.hast, page.file, manifest.pages, docsBase);

      const nav = toDocsNav(manifest.pages, docsBase);
      const activeHref = docPageHref(page.slug, docsBase);
      const renderNav = decorateNav(nav.items, activeHref, nav.headingsByHref);

      const breadcrumb = buildBreadcrumb(manifest.pages, page.slug, docsBase);

      res.render('docs-layout', {
        ...baseLayoutContext(page.title || page.slug, 'documentation', manifest, liveReload, {
          content: toHtml(parsed.hast),
          onThisPage: [],
        }),
        docsNav: renderNav,
        docsNavTitle: 'Documentation',
        breadcrumb,
        pageTitle: page.title || page.slug,
      });
    } catch (error) {
      console.error('Error serving page:', error);
      res.status(500).send('Internal server error');
    }
  });

  // start the server
  const server = app.listen(port, () => {
    const addr = server.address();
    const actualPort = typeof addr === 'object' && addr ? addr.port : port;
    console.log(`\n📄 Plugin Documentation Server`);
    console.log(`✓ Serving: ${docsPath}`);
    console.log(`✓ URL: http://localhost:${actualPort}`);
    console.log(`✓ Live reload: ${liveReload ? 'enabled' : 'disabled'}`);
    console.log(`\n🔍 Watching for changes...\n`);
  });

  const close = async () => {
    await watcher.close();
    return new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  };

  return { app, close };
}

function baseLayoutContext(
  title: string,
  activeTab: 'overview' | 'documentation',
  manifest: Manifest,
  liveReload: boolean,
  extras: { content: string; onThisPage: NavHeading[] }
) {
  const hasDocs = docsLandingPage(manifest.pages) !== null;
  return {
    title,
    activeTab,
    manifest,
    hasDocs,
    liveReload,
    docsNav: null as RenderNavItem[] | null,
    docsNavTitle: 'Documentation',
    breadcrumb: [] as Crumb[],
    pageTitle: '',
    ...extras,
  };
}

interface ReadmeResult {
  html: string;
  headings: NavHeading[];
}

// renderer that slugs h2/h3 ids like the docs parser does and collects them for the "on this
// page" rail. we skip h1 since the readme's title heading isn't a real on-page section.
function renderReadme(source: string): ReadmeResult {
  const slugger = new Slugger();
  const headings: NavHeading[] = [];

  const renderer = new marked.Renderer();
  const textParser = new marked.Parser();
  renderer.heading = ({ tokens, depth }): string => {
    const inner = marked.Parser.parseInline(tokens);
    // plain text from the tokens, so `code` or **bold** in a heading doesn't leak markdown into the rail
    const label = textParser.parseInline(tokens, textParser.textRenderer);
    if (depth === 2 || depth === 3) {
      const id = slugger.slug(label);
      headings.push({ id, text: label, level: depth });
      return `<h${depth} id="${escapeAttr(id)}">${inner}</h${depth}>\n`;
    }
    return `<h${depth}>${inner}</h${depth}>\n`;
  };

  const raw = marked.parse(source, { renderer, async: false, gfm: true, breaks: false }) as string;
  // wrap top-level tables so a wide table can scroll horizontally without pushing the column.
  // runs after sanitizing, which would otherwise strip the wrapper's class and tabindex.
  const html = sanitizeReadme(raw).replace(
    /<table(\s[^>]*)?>([\s\S]*?)<\/table>/g,
    '<div class="table-scroll" tabindex="0"><table$1>$2</table></div>'
  );
  return { html, headings };
}

// mirrors gcom's readme sanitizing (plugin-version.model.ts markdown2Html) so the preview strips what
// grafana.com strips. h2/h3 also keep their id, which the "on this page" rail links to.
function sanitizeReadme(html: string): string {
  return xss(html, {
    whiteList: { ...whiteList, code: ['class'], h2: ['id'], h3: ['id'] },
    onIgnoreTag: (tag, tagHtml) => {
      if (tag === 'input' && tagHtml.includes('disabled=""') && tagHtml.includes('type="checkbox"')) {
        return tagHtml;
      }
      return undefined;
    },
  });
}

function escapeAttr(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// walk the parsed hast, resolving relative link hrefs to preview urls and wrapping tables in a
// horizontal scroll container so a wide table cannot push the content column past its track.
// no new dependency: hast trees are plain data.
function rewriteHast(node: unknown, currentFile: string, pages: Page[], docsBase: string): void {
  if (!node || typeof node !== 'object') {
    return;
  }
  const el = node as {
    type?: string;
    tagName?: string;
    properties?: Record<string, unknown>;
    children?: unknown[];
  };
  if (el.type === 'element' && el.tagName === 'a' && el.properties && typeof el.properties.href === 'string') {
    const rewritten = resolveDocHref(el.properties.href, currentFile, pages, docsBase);
    el.properties.href = rewritten;
    if (/^https?:/i.test(rewritten) || rewritten.startsWith('//')) {
      el.properties.target = '_blank';
      el.properties.rel = 'noopener noreferrer';
    }
  }
  if (Array.isArray(el.children)) {
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as { type?: string; tagName?: string } | null;
      if (child && child.type === 'element' && child.tagName === 'table') {
        el.children[i] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-scroll'], tabIndex: 0 },
          children: [child],
        };
        rewriteHast(child, currentFile, pages, docsBase);
      } else {
        rewriteHast(el.children[i], currentFile, pages, docsBase);
      }
    }
  }
}

function decorateNav(
  items: NavItem[],
  activeHref: string,
  headingsByHref: Record<string, NavHeading[]>
): RenderNavItem[] {
  const walk = (nodes: NavItem[]): RenderNavItem[] =>
    nodes.map((item) => {
      const normalHref = stripTrailingSlash(item.href);
      const isActive = normalHref === activeHref;
      const children = item.children ? walk(item.children) : undefined;
      const descendantActive = children?.some((c) => c.isActive || c.descendantActive) ?? false;
      return {
        ...item,
        children,
        isActive,
        descendantActive,
        headings: isActive ? (headingsByHref[normalHref] ?? []) : [],
      };
    });
  return walk(items);
}

function buildBreadcrumb(pages: Page[], pageSlug: string, docsBase: string): Crumb[] {
  const items: Crumb[] = [{ label: 'Documentation', href: docsBase }];
  const ancestors = findDocAncestors(pages, pageSlug).filter((node) => node.slug !== DOCS_INDEX_SLUG);
  for (const node of ancestors) {
    const target = node.file ? node : firstRenderablePage(node);
    items.push({
      label: node.title,
      href: target ? docPageHref(target.slug, docsBase) : undefined,
    });
  }

  // one-crumb trail (the landing page) reads as noise beneath the Documentation tab, so drop it
  if (items.length < 2) {
    return [];
  }
  // last crumb is the current page and must not link to itself
  return items.map((item, index) => (index === items.length - 1 ? { label: item.label } : item));
}
