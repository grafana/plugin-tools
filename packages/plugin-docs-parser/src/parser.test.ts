import { describe, it, expect } from 'vitest';
import { toHtml } from 'hast-util-to-html';
import { parseMarkdown } from './parser.js';

describe('parseMarkdown', () => {
  it('should return a valid HAST root node', () => {
    const markdown = '## Hello World';
    const result = parseMarkdown(markdown);

    expect(result.hast).toBeDefined();
    expect(result.hast.type).toBe('root');
    expect(result.hast.children.length).toBeGreaterThan(0);
  });

  it('should parse simple markdown to HTML', () => {
    const markdown = '# Hello World\n\nThis is a paragraph.';
    const result = parseMarkdown(markdown);
    const html = toHtml(result.hast);

    expect(html).not.toContain('<h1');
    expect(html).toContain('<p>This is a paragraph.</p>');
    expect(result.frontmatter).toEqual({});
  });

  it('should strip h1 headings from the body', () => {
    const markdown = '# Page Title\n\n## Section\n\nContent.';
    const result = parseMarkdown(markdown);
    const html = toHtml(result.hast);

    expect(html).not.toContain('<h1');
    expect(html).toContain('<h2');
    expect(html).toContain('Content.');
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
    expect(html).not.toContain('<h1');
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

    expect(html).toContain('<code class="hljs language-typescript">');
    expect(html).toContain('<span class="hljs-number">42</span>');
  });

  it('should handle empty frontmatter', () => {
    const markdown = `---
---
## Title`;

    const result = parseMarkdown(markdown);
    const html = toHtml(result.hast);

    expect(result.frontmatter).toEqual({});
    expect(html).toContain('Title');
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

    // safe content should remain (h1 is stripped, paragraph is kept)
    expect(html).not.toContain('<h1');
    expect(html).toContain('<p>Regular content.</p>');
  });

  describe('raw HTML', () => {
    const render = (markdown: string) => toHtml(parseMarkdown(markdown).hast);

    it('should keep details and summary with markdown inside', () => {
      const html = render(`<details>
<summary>How does it work?</summary>

It works by parsing **markdown**.

</details>`);

      expect(html).toBe(
        '<details>\n<summary>How does it work?</summary>\n<p>It works by parsing <strong>markdown</strong>.</p>\n</details>'
      );
    });

    it('should keep the open attribute on details', () => {
      expect(render('<details open>\n<summary>Open</summary>\n\nText\n\n</details>')).toContain('<details open>');
    });

    it('should keep line breaks in table cells', () => {
      const html = render('| Setting | Values |\n| --- | --- |\n| Mode | one<br>two |');

      expect(html).toContain('<td>one<br>two</td>');
    });

    it('should remove other tags and keep their text', () => {
      const html = render(
        '<div class="note">\n\nPress <kbd>Enter</kbd> or <span style="color:red">Esc</span>.\n\n</div>'
      );

      expect(html).toBe('\n<p>Press Enter or Esc.</p>\n');
    });

    it('should remove comments', () => {
      expect(render('<!-- vale off -->\n\nText')).toBe('\n<p>Text</p>');
    });

    it('should remove attributes other than open from details and summary', () => {
      const html = render(
        '<details class="x" style="color:red" ontoggle="alert(1)" open>\n<summary onclick="alert(1)" id="s">Title</summary>\n\nText\n\n</details>'
      );

      expect(html).toContain('<details open>');
      expect(html).not.toContain('class=');
      expect(html).not.toContain('style=');
      expect(html).not.toContain('alert');
    });

    it('should remove id and name from raw HTML so it cannot clobber page globals', () => {
      const html = render(
        '<details id="dataLayer" name="x">\n<summary id="s" name="n">Title</summary>\n\nText<br id="b">\n\n</details>'
      );

      expect(html).not.toMatch(/\bid=|\bname=/);
    });

    it('should keep ids on headings and footnotes', () => {
      const html = render('## Setup\n\nText.[^1]\n\n[^1]: A note.');

      expect(html).toContain('<h2 id="setup">');
      expect(html).toContain('id="user-content-fnref-1"');
      expect(html).toContain('<li id="user-content-fn-1">');
      expect(html).toContain('id="footnote-label"');
    });

    it('should remove a summary outside details', () => {
      expect(render('<summary>Alone</summary>\n\nText')).not.toContain('<summary>');
    });

    it.each([
      ['a script with its content', '<script>alert(1)</script>'],
      ['a style with its content', '<style>body { display: none }</style>'],
      ['an iframe', '<iframe src="https://example.com/alert(1)"></iframe>'],
      ['an image error handler', '<img src="x" onerror="alert(1)">'],
      ['a javascript link', '<a href="javascript:alert(1)">click</a>'],
      ['an svg with a handler', '<svg onload="alert(1)"><circle /></svg>'],
      ['a summary handler inside details', '<details><summary onmouseover="alert(1)">x</summary></details>'],
    ])('should remove %s', (_name, markdown) => {
      const html = render(`${markdown}\n\nAfter`);

      expect(html).not.toMatch(/alert|display: none|<script|<style|<iframe|<svg|onerror|javascript:/);
      expect(html).toContain('<p>After</p>');
    });

    it('should leave headings inside details out of the table of contents', () => {
      const result = parseMarkdown('## Setup\n\n<details>\n<summary>More</summary>\n\n### Hidden step\n\n</details>');

      expect(result.headings).toEqual([{ level: 2, id: 'setup', text: 'Setup' }]);
      expect(toHtml(result.hast)).toContain('<h3 id="hidden-step">Hidden step</h3>');
    });
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

    it('should not list the generated footnotes heading', () => {
      const markdown = '## Ports\n\nYugabyteDB listens on port 5433.[^1]\n\n[^1]: Unless you changed it.\n';
      const result = parseMarkdown(markdown);

      expect(result.headings).toEqual([{ level: 2, id: 'ports', text: 'Ports' }]);
    });
  });

  describe('syntax highlighting', () => {
    const render = (markdown: string) => toHtml(parseMarkdown(markdown).hast);

    it('should highlight a fenced block with a known language', () => {
      const html = render('```sql\nSELECT 1\n```');

      expect(html).toContain('class="hljs language-sql"');
      expect(html).toContain('<span class="hljs-keyword">SELECT</span>');
    });

    it('should highlight a language alias', () => {
      expect(render('```js\nconst a = 1\n```')).toContain('<span class="hljs-keyword">const</span>');
    });

    it('should leave a block with an unsupported language as plain text', () => {
      const html = render('```hcl\nx = 1\n```');

      expect(html).toContain('language-hcl');
      expect(html).toContain('>x = 1\n</code>');
      expect(html).not.toContain('hljs-');
    });

    it('should leave a block without a language and inline code alone', () => {
      expect(render('```\nSELECT 1\n```')).toContain('<pre><code>SELECT 1\n</code></pre>');
      expect(render('Use `SELECT 1` here.')).toContain('<code>SELECT 1</code>');
    });

    it('should highlight code inside a callout', () => {
      const html = render('> [!NOTE]\n> ```yaml\n> enabled: true\n> ```');

      expect(html).toContain('callout-note');
      expect(html).toContain('<span class="hljs-attr">enabled:</span>');
    });

    it('should escape markup in code', () => {
      const html = render('```html\n<script>alert(1)</script>\n```');

      expect(html).not.toContain('<script>');
      expect(html).toContain('&#x3C;');
    });

    it('should not let authors inject highlight classes', () => {
      expect(render('<span class="hljs-keyword">SELECT</span>')).not.toContain('hljs');
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
