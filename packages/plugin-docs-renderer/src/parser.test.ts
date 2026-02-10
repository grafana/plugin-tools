import { describe, it, expect } from 'vitest';
import { parseMarkdown } from './parser.js';

describe('parseMarkdown', () => {
  it('should parse simple markdown to HTML', () => {
    const markdown = '# Hello World\n\nThis is a paragraph.';
    const result = parseMarkdown(markdown);

    expect(result.html).toContain('<h1 id="hello-world">Hello World</h1>');
    expect(result.html).toContain('<p>This is a paragraph.</p>');
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

    expect(result.frontmatter).toEqual({
      title: 'Test Page',
      description: 'A test page',
    });
    expect(result.html).toContain('<h1 id="content">Content</h1>');
    expect(result.html).toContain('<p>Body text here.</p>');
  });

  it('should handle GitHub Flavored Markdown tables', () => {
    const markdown = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;

    const result = parseMarkdown(markdown);

    expect(result.html).toContain('<table>');
    expect(result.html).toContain('<th>Header 1</th>');
    expect(result.html).toContain('<td>Cell 1</td>');
  });

  it('should handle code blocks', () => {
    const markdown = '```typescript\nconst x = 42;\n```';
    const result = parseMarkdown(markdown);

    expect(result.html).toContain('<code');
    expect(result.html).toContain('const x = 42;');
  });

  it('should handle empty frontmatter', () => {
    const markdown = `---
---
# Title`;

    const result = parseMarkdown(markdown);

    expect(result.frontmatter).toEqual({});
    expect(result.html).toContain('<h1>Title</h1>');
  });

  it('should sanitize potentially dangerous HTML', () => {
    const markdown = `
# Test

<script>alert('xss')</script>

<img src="x" onerror="alert('xss')">

Regular content.
`;

    const result = parseMarkdown(markdown);

    // script tags should be removed
    expect(result.html).not.toContain('<script>');
    expect(result.html).not.toContain('alert(');

    // event handlers should be removed
    expect(result.html).not.toContain('onerror');

    // safe content should remain
    expect(result.html).toContain('<h1 id="test">Test</h1>');
    expect(result.html).toContain('<p>Regular content.</p>');
  });
});
