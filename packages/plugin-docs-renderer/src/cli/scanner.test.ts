import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { scanDocsFolder } from './scanner.js';

describe('scanDocsFolder', () => {
  const testDocsPath = join(__dirname, '..', '__fixtures__', 'test-docs');

  it('should scan markdown files and generate manifest', async () => {
    const result = await scanDocsFolder(testDocsPath);

    expect(result.manifest).toBeDefined();
    expect(result.manifest.title).toBe('Plugin Documentation');
    expect(result.manifest.pages).toHaveLength(3);
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

  it('should load file contents into memory', async () => {
    const result = await scanDocsFolder(testDocsPath);

    expect(result.files).toBeDefined();
    expect(Object.keys(result.files)).toHaveLength(3);
    expect(result.files['home.md']).toContain('---');
    expect(result.files['home.md']).toContain('title: Home Page');
    expect(result.files['home.md']).toContain('# Welcome');
  });

  it('should preserve frontmatter in file contents', async () => {
    const result = await scanDocsFolder(testDocsPath);

    const homeContent = result.files['home.md'];
    expect(homeContent).toContain('title: Home Page');
    expect(homeContent).toContain('description: Welcome to the test docs');
    expect(homeContent).toContain('sidebar_position: 1');
  });

  it('should include file reference in page object', async () => {
    const result = await scanDocsFolder(testDocsPath);

    const pages = result.manifest.pages;
    expect(pages[0].file).toBe('home.md');
    expect(pages[1].file).toBe('guide.md');
    expect(pages[2].file).toBe('advanced.md');
  });

  it('should throw error when no valid markdown files found', async () => {
    const emptyPath = join(__dirname, '..', '__fixtures__', 'non-existent');

    await expect(scanDocsFolder(emptyPath)).rejects.toThrow('No valid markdown files found');
  });
});
