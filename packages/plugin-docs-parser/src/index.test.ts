import { describe, it, expect } from 'vitest';
import { parseMarkdown, toHtml, type Manifest, type Page, type MarkdownFiles } from './index.js';

describe('@grafana/plugin-docs-renderer', () => {
  it('should re-export toHtml for HAST serialization', () => {
    const result = parseMarkdown('# Hello');
    const html = toHtml(result.hast);

    expect(html).toContain('<h1');
    expect(html).toContain('Hello');
  });

  it('should export core types', () => {
    const manifest: Manifest = {
      version: '1',
      title: 'Test Documentation',
      pages: [],
    };

    const page: Page = {
      title: 'Overview',
      slug: 'overview',
      file: 'index.md',
    };

    const files: MarkdownFiles = {
      'index.md': '# Overview',
    };

    expect(manifest.title).toBe('Test Documentation');
    expect(page.title).toBe('Overview');
    expect(files['index.md']).toBe('# Overview');
  });
});
