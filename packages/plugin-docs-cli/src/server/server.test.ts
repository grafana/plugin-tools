import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { join } from 'node:path';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import type { Express } from 'express';
import { startServer, type Server } from './server.js';

describe('startServer', () => {
  const fixturesPath = join(__dirname, '..', '__fixtures__');
  const testDocsPath = join(fixturesPath, 'test-docs');
  const unsafeSlugDocsPath = join(fixturesPath, 'unsafe-slug-docs');
  const emptyContentDocsPath = join(fixturesPath, 'empty-content-docs');
  const testReadmePath = join(fixturesPath, 'test-readme', 'README.md');
  let app: Express;
  let server: Server | null = null;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = null;
    }
  });

  it('should render the README on the Overview tab (/)', async () => {
    const result = await startServer({ docsPath: testDocsPath, readmePath: testReadmePath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<title>Overview - Plugin Documentation (local preview)</title>');
    expect(response.text).toContain('<h1>Test Plugin</h1>');
    expect(response.text).toContain('This is the plugin readme');
  });

  it('should show a placeholder when no README is configured', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('No README found');
  });

  it('should serve the docs landing page at /docs', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/docs');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<title>Overview - Plugin Documentation (local preview)</title>');
    expect(response.text).toContain('Welcome to the test docs');
  });

  it('should serve a docs page at /docs/<slug>', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/docs/guide');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<title>User Guide - Plugin Documentation (local preview)</title>');
    expect(response.text).toContain('This is a guide page.');
  });

  it('should serve a nested docs page at /docs/<dir>/<slug>', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/docs/config/settings');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<title>Settings - Plugin Documentation (local preview)</title>');
    expect(response.text).toContain('Configure your plugin settings');
  });

  it('should return 404 for /docs/index (the landing lives at /docs)', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/docs/index');

    expect(response.status).toBe(404);
  });

  it('should return 404 for a non-existent docs page', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/docs/non-existent');

    expect(response.status).toBe(404);
    expect(response.text).toContain('Page not found');
  });

  it('should hide the Documentation tab when the manifest has no landing page', async () => {
    const noIndexDocsPath = await mkdtemp(join(tmpdir(), 'docs-no-index-'));
    await writeFile(join(noIndexDocsPath, 'guide.md'), '---\ntitle: Guide\ndescription: A guide\n---\n\nGuide body.\n');
    const result = await startServer({ docsPath: noIndexDocsPath, readmePath: testReadmePath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    // Documentation tab is rendered but marked disabled, not as an anchor
    expect(response.text).not.toContain('<a href="/docs"');
    expect(response.text).toContain('Documentation');
  });

  it('should render docs nav in the rail on /docs pages', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/docs');

    expect(response.status).toBe(200);
    expect(response.text).toContain('class="docs-rail"');
    expect(response.text).toContain('>Documentation<');
    expect(response.text).toContain('<a href="/docs"');
    expect(response.text).toContain('<a href="/docs/guide"');
  });

  it('should nest active-page headings under the active nav item', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/docs/config/settings');

    expect(response.status).toBe(200);
    expect(response.text).toContain('href="#general-settings"');
    expect(response.text).toContain('href="#display-name"');
    expect(response.text).toContain('href="#advanced-settings"');
  });

  it('should render a breadcrumb on nested pages and none on the landing page', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const landing = await request(app).get('/docs');
    expect(landing.text).not.toContain('docs-breadcrumb');

    const nested = await request(app).get('/docs/config/settings');
    expect(nested.text).toContain('docs-breadcrumb');
    expect(nested.text).toContain('>Documentation<');
    expect(nested.text).toContain('>Configuration<');
  });

  it('should still render docs content when the frontmatter body is empty', async () => {
    const result = await startServer({ docsPath: emptyContentDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/docs');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<title>Empty Body - Plugin Documentation (local preview)</title>');
  });

  it('should serve static assets under /docs', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/docs/img/test.png');

    expect(response.status).toBe(200);
    expect(response.type).toBe('image/png');
  });

  it('should rewrite relative image srcs to /docs-scoped urls', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/docs/config/database');

    expect(response.status).toBe(200);
    expect(response.text).toContain('src="/docs/config/img/db-config.png"');
    expect(response.text).toContain('src="/docs/img/test.png"');
  });

  it('should resolve relative doc links to preview urls', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    // index.md links to ./guide, which lives at /docs/guide
    const response = await request(app).get('/docs');

    expect(response.status).toBe(200);
    expect(response.text).toContain('href="/docs/guide"');
  });

  it('should open external links in a new tab and keep internal links in place', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/docs');

    expect(response.status).toBe(200);
    expect(response.text).toContain('href="https://grafana.com" target="_blank" rel="noopener noreferrer"');
    expect(response.text).not.toMatch(/href="\/docs\/guide"[^>]*target="_blank"/);
  });

  it('should use plain heading text for README "On this page" labels', async () => {
    const result = await startServer({ docsPath: testDocsPath, readmePath: testReadmePath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toMatch(/class="docs-toc-link docs-toc-link-h2">Getting started with grafana-cli</);
  });

  it('should wrap tables in a horizontal scroll container', async () => {
    const tableDocsPath = await mkdtemp(join(tmpdir(), 'docs-table-'));
    await writeFile(
      join(tableDocsPath, 'index.md'),
      '---\ntitle: Overview\ndescription: Table page\n---\n\n| a | b |\n| - | - |\n| 1 | 2 |\n'
    );
    const result = await startServer({ docsPath: tableDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/docs');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<div class="table-scroll" tabindex="0"><table>');
  });

  it('should not include live reload script by default', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0, liveReload: false });
    server = result;
    app = result.app;

    const response = await request(app).get('/docs');

    expect(response.status).toBe(200);
    expect(response.text).not.toContain('__reload__');
    expect(response.text).not.toContain('location.reload()');
  });

  it('should include live reload script when enabled', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0, liveReload: true });
    server = result;
    app = result.app;

    const response = await request(app).get('/docs');

    expect(response.status).toBe(200);
    expect(response.text).toContain('__reload__');
    expect(response.text).toContain('location.reload()');
  });

  it('should have a live reload endpoint when enabled', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0, liveReload: true });
    server = result;
    app = result.app;

    const response = await request(app).get('/__reload__?t=0');

    expect([204, 205]).toContain(response.status);
  });

  it('should escape HTML entities in titles to prevent XSS', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/docs');

    expect(response.status).toBe(200);
    expect(response.text).toMatch(/<title[^>]*>[^<]*<\/title>/);
    expect(response.text).not.toMatch(/<a[^>]*>[^<]*<script/i);
  });

  it('should sanitize unsafe frontmatter slugs in navigation hrefs', async () => {
    const result = await startServer({ docsPath: unsafeSlugDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/docs');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<a href="/docs/home"');
    expect(response.text).not.toContain('onclick=');
    expect(response.text).not.toContain('%22');
  });
});
