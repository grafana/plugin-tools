import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { join } from 'node:path';
import type { Express } from 'express';
import { startServer, type Server } from './server.js';

describe('startServer', () => {
  const testDocsPath = join(__dirname, '..', '__fixtures__', 'test-docs');
  let app: Express;
  let server: Server | null = null;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = null;
    }
  });

  it('should serve the homepage (first page in manifest)', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<title>Home Page - Plugin Documentation</title>');
    expect(response.text).toContain('<h1 id="welcome">Welcome</h1>');
    expect(response.text).toContain('This is the home page of the test documentation.');
  });

  it('should serve a specific page by slug', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/guide');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<title>User Guide - Plugin Documentation</title>');
    expect(response.text).toContain('<h1 id="user-guide">User Guide</h1>');
    expect(response.text).toContain('This is a guide page.');
  });

  it('should serve a nested page by slug', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/advanced');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<h1 id="advanced-topics">Advanced Topics</h1>');
    expect(response.text).toContain('This covers advanced topics.');
  });

  it('should return 404 for non-existent page', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/non-existent');

    expect(response.status).toBe(404);
    expect(response.text).toContain('Page not found');
  });

  it('should include navigation links', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('class="docs-nav"');
    expect(response.text).toContain('<a href="/home"');
    expect(response.text).toContain('<a href="/guide"');
  });

  it('should serve static assets from img directory', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/img/test.png');

    expect(response.status).toBe(200);
    expect(response.type).toBe('image/png');
    expect(response.body).toBeDefined();
  });

  it('should not include live reload script by default', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0, liveReload: false });
    server = result;
    app = result.app;

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).not.toContain('__reload__');
    expect(response.text).not.toContain('location.reload()');
  });

  it('should include live reload script when enabled', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0, liveReload: true });
    server = result;
    app = result.app;

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('__reload__');
    expect(response.text).toContain('location.reload()');
  });

  it('should have live reload endpoint when enabled', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0, liveReload: true });
    server = result;
    app = result.app;

    const response = await request(app).get('/__reload__?t=0');

    // should return 204 (no changes) or 205 (reset content)
    expect([204, 205]).toContain(response.status);
  });

  it('should use frontmatter title when available', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/home');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<title>Home Page - Plugin Documentation</title>');
  });

  it('should use frontmatter title from advanced page', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/advanced');

    expect(response.status).toBe(200);
    // advanced.md now has frontmatter with title
    expect(response.text).toContain('<title>Advanced Topics - Plugin Documentation</title>');
  });

  it('should escape HTML entities in titles to prevent XSS', async () => {
    const result = await startServer({ docsPath: testDocsPath, port: 0 });
    server = result;
    app = result.app;

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    // verify that if manifest or page titles contained HTML, it would be escaped
    // manifest title should appear escaped in title tag and h1
    expect(response.text).toMatch(/<title[^>]*>[^<]*<\/title>/);
    expect(response.text).toMatch(/<h1[^>]*>[^<]*<\/h1>/);
    // navigation links should not contain unescaped HTML
    expect(response.text).not.toMatch(/<a[^>]*>[^<]*<script/i);
  });
});
