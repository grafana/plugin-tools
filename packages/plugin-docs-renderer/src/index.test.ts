import { describe, it, expect } from 'vitest';
import type { Manifest, Page, MarkdownFiles } from './index.js';

describe('@grafana/plugin-docs-renderer', () => {
  it('should export core types', () => {
    const manifest: Manifest = {
      version: '1.0',
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

    expect(manifest.version).toBe('1.0');
    expect(page.title).toBe('Overview');
    expect(files['index.md']).toBe('# Overview');
  });
});
