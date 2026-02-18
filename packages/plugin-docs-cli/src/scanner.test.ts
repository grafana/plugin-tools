import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import type { Page } from '@grafana/plugin-docs-parser';
import { scanDocsFolder } from './scanner.js';

describe('scanDocsFolder', () => {
  const testDocsPath = join(__dirname, '__fixtures__', 'test-docs');

  it('should scan markdown files and generate manifest', async () => {
    const result = await scanDocsFolder(testDocsPath);

    expect(result.manifest).toBeDefined();
    expect(result.manifest.version).toBe('1');
    expect(result.manifest.title).toBe('Plugin Documentation');
    expect(result.manifest.pages).toHaveLength(4); // home, guide, advanced, config
  });

  it('should sort pages by sidebar_position', async () => {
    const result = await scanDocsFolder(testDocsPath);

    const pages = result.manifest.pages;
    expect(pages[0].title).toBe('Home Page');
    expect(pages[0].slug).toBe('home');
    expect(pages[1].title).toBe('User Guide');
    expect(pages[1].slug).toBe('guide');
    expect(pages[2].title).toBe('Advanced Topics');
    expect(pages[2].slug).toBe('advanced');
  });

  it('should generate slugs from file paths', async () => {
    const result = await scanDocsFolder(testDocsPath);

    const pages = result.manifest.pages;
    expect(pages[0].slug).toBe('home');
    expect(pages[1].slug).toBe('guide');
    expect(pages[2].slug).toBe('advanced');
  });

  it('should load file contents into memory (frontmatter stripped)', async () => {
    const result = await scanDocsFolder(testDocsPath);

    expect(result.files).toBeDefined();
    expect(Object.keys(result.files)).toHaveLength(6); // includes nested config files + index
    expect(result.files['home.md']).toContain('# Welcome');
    expect(result.files['home.md']).not.toContain('---');
  });

  it('should include file reference in page object', async () => {
    const result = await scanDocsFolder(testDocsPath);

    const pages = result.manifest.pages;
    expect(pages[0].file).toBe('home.md');
    expect(pages[1].file).toBe('guide.md');
    expect(pages[2].file).toBe('advanced.md');
  });

  it('should not include headings in page objects', async () => {
    const result = await scanDocsFolder(testDocsPath);

    const pages = result.manifest.pages;
    for (const page of pages) {
      expect(page).not.toHaveProperty('headings');
    }
  });

  it('should throw error when no valid markdown files found', async () => {
    const emptyPath = join(__dirname, '__fixtures__', 'non-existent');

    await expect(scanDocsFolder(emptyPath)).rejects.toThrow('No valid markdown files found');
  });

  it('should skip files with wrong frontmatter types', async () => {
    const invalidPath = join(__dirname, '__fixtures__', 'invalid-frontmatter-docs');

    await expect(scanDocsFolder(invalidPath)).rejects.toThrow('No valid markdown files found');
  });

  it('should ignore unsafe frontmatter slugs and fallback to generated slug', async () => {
    const unsafeSlugPath = join(__dirname, '__fixtures__', 'unsafe-slug-docs');
    const result = await scanDocsFolder(unsafeSlugPath);

    expect(result.manifest.pages).toHaveLength(1);
    expect(result.manifest.pages[0].slug).toBe('home');
  });

  describe('nested directories', () => {
    it('should promote index.md as the directory page', async () => {
      const result = await scanDocsFolder(testDocsPath);

      const configPage = result.manifest.pages.find((p: Page) => p.slug === 'config');
      expect(configPage).toBeDefined();
      expect(configPage?.title).toBe('Configuration');
      expect(configPage?.file).toBe('config/index.md');
      expect(configPage?.children).toBeDefined();
      expect(configPage?.children).toHaveLength(2);
    });

    it('should generate slugs with directory prefixes', async () => {
      const result = await scanDocsFolder(testDocsPath);

      const configPage = result.manifest.pages.find((p: Page) => p.slug === 'config');
      const children = configPage?.children || [];

      expect(children[0].slug).toBe('config/settings');
      expect(children[1].slug).toBe('config/database');
    });

    it('should sort nested pages by sidebar_position', async () => {
      const result = await scanDocsFolder(testDocsPath);

      const configPage = result.manifest.pages.find((p: Page) => p.slug === 'config');
      const children = configPage?.children || [];

      expect(children[0].title).toBe('Settings');
      expect(children[1].title).toBe('Database');
    });

    it('should store nested files with relative paths', async () => {
      const result = await scanDocsFolder(testDocsPath);

      expect(result.files['config/settings.md']).toBeDefined();
      expect(result.files['config/settings.md']).toContain('# Settings');
      expect(result.files['config/database.md']).toBeDefined();
      expect(result.files['config/database.md']).toContain('# Database');
    });

    it('should reference nested files correctly in page objects', async () => {
      const result = await scanDocsFolder(testDocsPath);

      const configPage = result.manifest.pages.find((p: Page) => p.slug === 'config');
      const children = configPage?.children || [];

      expect(children[0].file).toBe('config/settings.md');
      expect(children[1].file).toBe('config/database.md');
    });
  });
});
