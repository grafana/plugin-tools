import { describe, it, expect } from 'vitest';
import { toHtml } from 'hast-util-to-html';
import { parseMarkdown } from './parser.js';

describe('parseMarkdown', () => {
  it('should return a valid HAST root node', () => {
    const markdown = '# Hello World';
    const result = parseMarkdown(markdown);

    expect(result.hast).toBeDefined();
    expect(result.hast.type).toBe('root');
    expect(result.hast.children.length).toBeGreaterThan(0);
  });

  it('should parse simple markdown to HTML', () => {
    const markdown = '# Hello World\n\nThis is a paragraph.';
    const result = parseMarkdown(markdown);
    const html = toHtml(result.hast);

    expect(html).toContain('<h1 id="hello-world">Hello World</h1>');
    expect(html).toContain('<p>This is a paragraph.</p>');
    expect(result.frontmatter).toEqual({});
  });

  it('should extract frontmatter', () => {
    const markdown = `---
title: Test Page
description: A test page
---
# Content

Body text here.`;

    const result = parseMarkdown(markdown);
    const html = toHtml(result.hast);

    expect(result.frontmatter).toEqual({
      title: 'Test Page',
      description: 'A test page',
    });
    expect(html).toContain('<h1 id="content">Content</h1>');
    expect(html).toContain('<p>Body text here.</p>');
  });

  it('should handle GitHub Flavored Markdown tables', () => {
    const markdown = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;

    const result = parseMarkdown(markdown);
    const html = toHtml(result.hast);

    expect(html).toContain('<table>');
    expect(html).toContain('<th>Header 1</th>');
    expect(html).toContain('<td>Cell 1</td>');
  });

  it('should handle code blocks', () => {
    const markdown = '```typescript\nconst x = 42;\n```';
    const result = parseMarkdown(markdown);
    const html = toHtml(result.hast);

    expect(html).toContain('<code');
    expect(html).toContain('const x = 42;');
  });

  it('should handle empty frontmatter', () => {
    const markdown = `---
---
# Title`;

    const result = parseMarkdown(markdown);
    const html = toHtml(result.hast);

    expect(result.frontmatter).toEqual({});
    expect(html).toContain('Title');
  });

  it('should preserve safe raw HTML elements like <details>', () => {
    const markdown = `# FAQ

<details>
<summary>How does it work?</summary>

It works by parsing markdown.

</details>`;

    const result = parseMarkdown(markdown);
    const html = toHtml(result.hast);

    expect(html).toContain('<details>');
    expect(html).toContain('<summary>');
    expect(html).toContain('It works by parsing markdown.');
  });

  it('should sanitize potentially dangerous HTML', () => {
    const markdown = `
# Test

<script>alert('xss')</script>

<img src="x" onerror="alert('xss')">

Regular content.
`;

    const result = parseMarkdown(markdown);
    const html = toHtml(result.hast);

    // script tags should be removed
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('alert(');

    // event handlers should be removed
    expect(html).not.toContain('onerror');

    // safe content should remain
    expect(html).toContain('<h1 id="test">Test</h1>');
    expect(html).toContain('<p>Regular content.</p>');
  });

  describe('heading extraction', () => {
    it('should extract h2 and h3 headings', () => {
      const markdown = `# Title

## Getting Started

Some text.

### Prerequisites

More text.

## Configuration

### Advanced Options

Even more text.

#### Ignored Depth
`;

      const result = parseMarkdown(markdown);

      expect(result.headings).toEqual([
        { level: 2, id: 'getting-started', text: 'Getting Started' },
        { level: 3, id: 'prerequisites', text: 'Prerequisites' },
        { level: 2, id: 'configuration', text: 'Configuration' },
        { level: 3, id: 'advanced-options', text: 'Advanced Options' },
      ]);
    });

    it('should return empty array when no h2/h3 headings exist', () => {
      const markdown = '# Only an H1\n\nSome paragraph text.';
      const result = parseMarkdown(markdown);

      expect(result.headings).toEqual([]);
    });

    it('should strip inline HTML from heading text', () => {
      const markdown = '## Install the <code>plugin</code> package';
      const result = parseMarkdown(markdown);

      expect(result.headings).toHaveLength(1);
      expect(result.headings[0].text).toBe('Install the plugin package');
    });
  });

  describe('asset path rewriting', () => {
    const assetBaseUrl = 'https://cdn.example.com/my-plugin/1.0.0/docs';

    it('should rewrite relative image paths to absolute CDN URLs', () => {
      const markdown = '![screenshot](img/screenshot.png)';
      const result = parseMarkdown(markdown, { assetBaseUrl });
      const html = toHtml(result.hast);

      expect(html).toContain(`src="${assetBaseUrl}/img/screenshot.png"`);
    });

    it('should leave absolute URLs untouched', () => {
      const markdown = '![logo](https://example.com/logo.png)';
      const result = parseMarkdown(markdown, { assetBaseUrl });
      const html = toHtml(result.hast);

      expect(html).toContain('src="https://example.com/logo.png"');
    });

    it('should leave protocol-relative URLs untouched', () => {
      const markdown = '![logo](//example.com/logo.png)';
      const result = parseMarkdown(markdown, { assetBaseUrl });
      const html = toHtml(result.hast);

      expect(html).toContain('src="//example.com/logo.png"');
    });

    it('should not rewrite paths when assetBaseUrl is not provided', () => {
      const markdown = '![screenshot](img/screenshot.png)';
      const result = parseMarkdown(markdown);
      const html = toHtml(result.hast);

      expect(html).toContain('src="img/screenshot.png"');
    });

    it('should handle trailing slash on assetBaseUrl', () => {
      const markdown = '![screenshot](img/screenshot.png)';
      const result = parseMarkdown(markdown, { assetBaseUrl: assetBaseUrl + '/' });
      const html = toHtml(result.hast);

      expect(html).toContain(`src="${assetBaseUrl}/img/screenshot.png"`);
      expect(html).not.toContain('//img');
    });
  });

  describe('doc link rewriting', () => {
    it('should rewrite .md links to clean URLs', () => {
      const markdown = '[Installation](installation.md)';
      const result = parseMarkdown(markdown);
      const html = toHtml(result.hast);

      expect(html).toContain('href="installation"');
    });

    it('should rewrite .md links with fragments', () => {
      const markdown = '[Config section](configuration.md#auth)';
      const result = parseMarkdown(markdown);
      const html = toHtml(result.hast);

      expect(html).toContain('href="configuration#auth"');
    });

    it('should rewrite relative .md links with paths', () => {
      const markdown = '[Setup](../getting-started/setup.md)';
      const result = parseMarkdown(markdown);
      const html = toHtml(result.hast);

      expect(html).toContain('href="../getting-started/setup"');
    });

    it('should leave absolute URLs untouched', () => {
      const markdown = '[Docs](https://grafana.com/docs/index.md)';
      const result = parseMarkdown(markdown);
      const html = toHtml(result.hast);

      expect(html).toContain('href="https://grafana.com/docs/index.md"');
    });

    it('should leave mailto links untouched', () => {
      const markdown = '[Email](mailto:support@example.md)';
      const result = parseMarkdown(markdown);
      const html = toHtml(result.hast);

      expect(html).toContain('href="mailto:support@example.md"');
    });
  });
});
