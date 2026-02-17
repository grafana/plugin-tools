import express, { type Express, type Request, type Response } from 'express';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { watch } from 'chokidar';
import createDebug from 'debug';
import { parseMarkdown, toHtml, type Manifest, type Page, type MarkdownFiles } from '@grafana/plugin-docs-parser';
import { scanDocsFolder } from '../scanner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const debug = createDebug('plugin-docs-cli:server');

export interface ServerOptions {
  docsPath: string;
  port: number;
  liveReload?: boolean;
}

export interface Server {
  app: Express;
  close: () => Promise<void>;
}

/**
 * Starts a development server for previewing plugin documentation.
 *
 * @param options - Server configuration options
 * @returns Server instance with app and close method
 */
export async function startServer(options: ServerOptions): Promise<Server> {
  const { docsPath, port = 3001, liveReload = false } = options;

  debug('Starting server with options: docsPath=%s, port=%d, liveReload=%s', docsPath, port, liveReload);

  const app = express();
  let lastModified = Date.now();

  // configure EJS
  app.set('view engine', 'ejs');
  app.set('views', join(__dirname, 'views'));

  // scan filesystem and generate manifest + load files into memory
  debug('Scanning docs folder: %s', docsPath);
  const scanned = await scanDocsFolder(docsPath);
  let manifest: Manifest = scanned.manifest;
  let files: MarkdownFiles = scanned.files;
  debug('Manifest generated with %d pages, %d files loaded', manifest.pages.length, Object.keys(files).length);

  // setup file watcher for markdown files
  const watcher = watch(join(docsPath, '**/*.md'), {
    ignoreInitial: true,
  });
  debug('File watcher initialized for %s', docsPath);

  const rescan = async (event: string, path: string) => {
    debug('File %s: %s', event, path);
    lastModified = Date.now();

    try {
      const rescanned = await scanDocsFolder(docsPath);
      manifest = rescanned.manifest;
      files = rescanned.files;
    } catch (error) {
      console.error('Error re-scanning docs folder:', error);
    }
  };

  watcher.on('change', (p) => rescan('changed', p));
  watcher.on('add', (p) => rescan('added', p));
  watcher.on('unlink', (p) => rescan('removed', p));

  // serve static assets (images, etc.) from the docs folder at root level
  // skip .md files so they're handled by the page route, not served raw
  const docsStatic = express.static(docsPath, { index: false, redirect: false, dotfiles: 'ignore', extensions: [] });
  app.use((req, res, next) => {
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

  // helper to find page by slug in manifest
  function findPageBySlug(slug: string, pages: Page[]): Page | null {
    for (const page of pages) {
      if (page.slug === slug) {
        return page;
      }
      if (page.children) {
        const found = findPageBySlug(slug, page.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  // serve documentation pages (matches single and nested paths)
  app.get('*', async (req: Request, res: Response) => {
    try {
      // extract slug from path (remove leading/trailing slashes)
      const slug = req.path === '/' ? manifest.pages[0]?.slug || '' : req.path.replace(/^\/|\/$/g, '');

      if (!slug) {
        debug('No pages found in manifest');
        res.status(404).send('No pages found in manifest');
        return;
      }

      debug('Request for slug: %s', slug);

      // find the page for this slug
      const page = findPageBySlug(slug, manifest.pages);
      if (!page) {
        debug('Page not found for slug: %s', slug);
        res.status(404).send('Page not found');
        return;
      }

      // get markdown content from memory
      const fileContent = files[page.file];
      if (!fileContent) {
        debug('File content not found in memory for: %s', page.file);
        res.status(404).send('File content not found');
        return;
      }

      const parsed = parseMarkdown(fileContent);
      const title = page.title || slug;

      res.render('docs-layout', {
        title,
        content: toHtml(parsed.hast),
        manifest,
        currentPath: slug,
        headings: parsed.headings,
        liveReload,
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
