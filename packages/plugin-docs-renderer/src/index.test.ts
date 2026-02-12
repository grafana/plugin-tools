import { describe, it, expect } from 'vitest';
import type { Manifest, Page, MarkdownFiles } from './index.js';

describe('@grafana/plugin-docs-renderer', () => {
  it('should export core types', () => {
    const manifest: Manifest = {
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
