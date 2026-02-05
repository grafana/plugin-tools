import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { join } from 'node:path';
import type { Express } from 'express';
import { startServer } from './server.js';

describe('startServer', () => {
  const testDocsPath = join(__dirname, '__fixtures__', 'test-docs');
  let app: Express;

  afterEach(() => {
    // cleanup: close any open connections
    if (app) {
      const server = (app as any).server;
      if (server?.close) {
        server.close();
      }
    }
  });

  it('should serve the homepage (first page in manifest)', async () => {
    app = startServer({ docsPath: testDocsPath, port: 0 });

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<title>Home Page - Test Plugin Documentation</title>');
    expect(response.text).toContain('<h1>Welcome</h1>');
    expect(response.text).toContain('This is the home page of the test documentation.');
  });

  it('should serve a specific page by slug', async () => {
    app = startServer({ docsPath: testDocsPath, port: 0 });

    const response = await request(app).get('/guide');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<title>User Guide - Test Plugin Documentation</title>');
    expect(response.text).toContain('<h1>User Guide</h1>');
    expect(response.text).toContain('This is a guide page.');
  });

  it('should serve a nested page by slug', async () => {
    app = startServer({ docsPath: testDocsPath, port: 0 });

    const response = await request(app).get('/advanced');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<h1>Advanced Topics</h1>');
    expect(response.text).toContain('This covers advanced topics.');
  });

  it('should return 404 for non-existent page', async () => {
    app = startServer({ docsPath: testDocsPath, port: 0 });

    const response = await request(app).get('/non-existent');

    expect(response.status).toBe(404);
    expect(response.text).toContain('Page not found');
  });

  it('should include navigation links', async () => {
    app = startServer({ docsPath: testDocsPath, port: 0 });

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<nav>');
    expect(response.text).toContain('<a href="/home">Home</a>');
    expect(response.text).toContain('<a href="/guide">Guide</a>');
  });

  it('should serve static assets from img directory', async () => {
    app = startServer({ docsPath: testDocsPath, port: 0 });

    const response = await request(app).get('/img/test.png');

    expect(response.status).toBe(200);
    expect(response.type).toBe('image/png');
    expect(response.body).toBeDefined();
  });

  it('should not include live reload script by default', async () => {
    app = startServer({ docsPath: testDocsPath, port: 0, liveReload: false });

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).not.toContain('__reload__');
    expect(response.text).not.toContain('location.reload()');
  });

  it('should include live reload script when enabled', async () => {
    app = startServer({ docsPath: testDocsPath, port: 0, liveReload: true });

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('__reload__');
    expect(response.text).toContain('location.reload()');
  });

  it('should have live reload endpoint when enabled', async () => {
    app = startServer({ docsPath: testDocsPath, port: 0, liveReload: true });

    const response = await request(app).get('/__reload__?t=0');

    // should return 204 (no changes) or 205 (reset content)
    expect([204, 205]).toContain(response.status);
  });

  it('should use frontmatter title when available', async () => {
    app = startServer({ docsPath: testDocsPath, port: 0 });

    const response = await request(app).get('/home');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<title>Home Page - Test Plugin Documentation</title>');
  });

  it('should fallback to slug when no frontmatter title', async () => {
    app = startServer({ docsPath: testDocsPath, port: 0 });

    const response = await request(app).get('/advanced');

    expect(response.status).toBe(200);
    // should use slug as fallback since advanced.md has no frontmatter title
    expect(response.text).toContain('<title>advanced - Test Plugin Documentation</title>');
  });
});
