import { describe, it, expect } from 'vitest';
import { parseMarkdown, type Manifest, type Page, type MarkdownFiles } from './index.js';

describe('@grafana/plugin-docs-parser', () => {
  it('should export parseMarkdown', () => {
    const result = parseMarkdown('# Hello');
    expect(result.hast).toBeDefined();
    expect(result.frontmatter).toBeDefined();
    expect(result.headings).toBeDefined();
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
