import express, { type Express, type Request, type Response } from 'express';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { watch } from 'chokidar';
import createDebug from 'debug';
import escapeHtml from 'escape-html';
import { parseMarkdown } from './parser.js';
import type { Manifest, Page } from './types.js';

const debug = createDebug('plugin-docs-renderer:server');

export interface ServerOptions {
  docsPath: string;
  port: number;
  liveReload?: boolean;
}

// will support nested pages in the future
function generateNavItems(pages: Page[]): string {
  return pages.map((page) => `<li><a href="/${escapeHtml(page.slug)}">${escapeHtml(page.title)}</a></li>`).join('\n');
}

/**
 * Generates an HTML template for a documentation page.
 */
function generatePageHTML(title: string, content: string, manifest: Manifest, liveReload: boolean): string {
  // generate a simple navigation from manifest
  const navItems = generateNavItems(manifest.pages);

  // optional live reload script
  const reloadScript = liveReload
    ? `
    <script>
      let lastCheck = Date.now();
      setInterval(async () => {
        try {
          const res = await fetch('/__reload__?t=' + lastCheck);
          if (res.status === 205) {
            location.reload();
          }
          lastCheck = Date.now();
        } catch (e) {
          // Ignore fetch errors
        }
      }, 1000);
    </script>
  `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - ${escapeHtml(manifest.title)}</title>
</head>
<body>
  <nav>
    <h1>${escapeHtml(manifest.title)}</h1>
    <ul>
      ${navItems}
    </ul>
  </nav>
  <hr>
  <main>
    ${content}
  </main>
  ${reloadScript}
</body>
</html>
  `.trim();
}

/**
 * Starts a development server for previewing plugin documentation.
 *
 * @param options - Server configuration options
 * @returns The Express app instance
 */
export function startServer(options: ServerOptions): Express {
  const { docsPath, port = 3000, liveReload = false } = options;

  debug('Starting server with options: docsPath=%s, port=%d, liveReload=%s', docsPath, port, liveReload);

  const app = express();
  let lastModified = Date.now();

  // setup file watcher
  const watcher = watch([join(docsPath, '**/*.md'), join(docsPath, 'manifest.json')], {
    ignoreInitial: true,
  });
  debug('File watcher initialized for %s', docsPath);

  watcher.on('change', async (path) => {
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
    const requestedSlug = req.params.slug || 'index';
    debug('Request for slug: %s', requestedSlug);

    try {
      // load manifest from disk
      const manifestPath = join(docsPath, 'manifest.json');
      const manifestContent = await readFile(manifestPath, 'utf-8');
      const manifest: Manifest = JSON.parse(manifestContent);

      // default to first page in manifest
      const slug = req.params.slug || manifest.pages[0]?.slug;
      if (!slug) {
        debug('No pages found in manifest');
        res.status(404).send('No pages found in manifest');
        return;
      }

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
      const html = generatePageHTML(title, parsed.html, manifest, liveReload);
      res.send(html);
    } catch (error) {
      console.error('Error serving page:', error);
      res.status(500).send('Internal server error');
    }
  });

  // start the server
  app.listen(port, () => {
    console.log(`\n📄 Plugin Documentation Server`);
    console.log(`✓ Serving: ${docsPath}`);
    console.log(`✓ URL: http://localhost:${port}`);
    console.log(`✓ Live reload: ${liveReload ? 'enabled' : 'disabled'}`);
    console.log(`\n🔍 Watching for changes...\n`);
  });

  return app;
}
