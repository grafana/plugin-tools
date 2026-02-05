import express, { type Express, type Request, type Response } from 'express';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { watch } from 'chokidar';
import createDebug from 'debug';
import { parseMarkdown } from './parser.js';
import type { Manifest, Page } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const debug = createDebug('plugin-docs-renderer:server');

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
export function startServer(options: ServerOptions): Server {
  const { docsPath, port = 3000, liveReload = false } = options;

  debug('Starting server with options: docsPath=%s, port=%d, liveReload=%s', docsPath, port, liveReload);

  const app = express();
  let lastModified = Date.now();

  // configure EJS
  app.set('view engine', 'ejs');
  app.set('views', join(__dirname, 'views'));

  const manifestPath = join(docsPath, 'manifest.json');
  let manifest: Manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

  // setup file watcher
  const watcher = watch([join(docsPath, '**/*.md'), join(docsPath, 'manifest.json')], {
    ignoreInitial: true,
  });
  debug('File watcher initialized for %s', docsPath);

  watcher.on('change', (path) => {
    debug('File changed: %s', path);
    lastModified = Date.now();
  });

  // serve static assets
  app.use('/img', express.static(join(docsPath, 'img')));
  app.use('/assets', express.static(join(docsPath, 'assets')));
  app.use('/images', express.static(join(docsPath, 'images')));

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
  function findPageBySlug(slug: string, pages: Page[]): string | null {
    for (const page of pages) {
      if (page.slug === slug) {
        return page.file;
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

  // serve documentation pages
  app.get('/:slug?', async (req: Request, res: Response) => {
    try {
      // default to first page in manifest
      const slug = req.params.slug || manifest.pages[0]?.slug;
      if (!slug) {
        debug('No pages found in manifest');
        res.status(404).send('No pages found in manifest');
        return;
      }

      debug('Request for slug: %s', slug);

      // find the file for this slug
      const fileName = findPageBySlug(slug, manifest.pages);
      if (!fileName) {
        debug('Page not found for slug: %s', slug);
        res.status(404).send('Page not found');
        return;
      }

      // read and parse the markdown file
      const filePath = join(docsPath, fileName);
      const fileContent = await readFile(filePath, 'utf-8');
      const parsed = parseMarkdown(fileContent);

      const title = (parsed.frontmatter.title as string) || slug;

      res.render('plugin-details-page', {
        title,
        content: parsed.html,
        manifest,
        liveReload,
      });
    } catch (error) {
      console.error('Error serving page:', error);
      res.status(500).send('Internal server error');
    }
  });

  // start the server
  const server = app.listen(port, () => {
    console.log(`\n📄 Plugin Documentation Server`);
    console.log(`✓ Serving: ${docsPath}`);
    console.log(`✓ URL: http://localhost:${port}`);
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
