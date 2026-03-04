import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { checkMarkdown } from './markdown.js';
import { Rule } from '../types.js';

const input = (docsPath: string, strict = true) => ({ docsPath, strict });

// helper: valid frontmatter markdown file content
const md = (body = '') => `---\ntitle: Page\ndescription: A page\n---\n${body}`;

describe('checkMarkdown', () => {
  it('should return empty for nonexistent path', async () => {
    const findings = await checkMarkdown(input('/nonexistent/path'));
    expect(findings).toHaveLength(0);
  });

  it('should return empty for valid markdown with no issues', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
    await writeFile(join(tmp, 'index.md'), md('## Hello\n\nSome content.\n'));

    const findings = await checkMarkdown(input(tmp));
    expect(findings).toHaveLength(0);
  });

  // --- no-raw-html ---

  describe('no-raw-html', () => {
    it('should report raw HTML tags', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('<div>content</div>'));

      const findings = await checkMarkdown(input(tmp));

      const htmlFindings = findings.filter((f) => f.rule === Rule.NoRawHtml);
      expect(htmlFindings.length).toBeGreaterThanOrEqual(1);
      expect(htmlFindings[0].severity).toBe('error');
    });

    it('should report as warning in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('<div>content</div>'));

      const findings = await checkMarkdown(input(tmp, false));

      const htmlFindings = findings.filter((f) => f.rule === Rule.NoRawHtml);
      expect(htmlFindings.length).toBeGreaterThanOrEqual(1);
      expect(htmlFindings[0].severity).toBe('warning');
    });

    it('should allow <br> tags', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('Line 1<br>Line 2'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoRawHtml)).toBeUndefined();
    });

    it('should allow <details> and <summary> tags', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('<details><summary>Click</summary>\nHidden content\n</details>'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoRawHtml)).toBeUndefined();
    });

    it('should not report HTML inside fenced code blocks', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('```html\n<div>example</div>\n```'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoRawHtml)).toBeUndefined();
    });

    it('should report HTML with attributes', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('<span class="highlight">text</span>'));

      const findings = await checkMarkdown(input(tmp));

      const htmlFindings = findings.filter((f) => f.rule === Rule.NoRawHtml);
      expect(htmlFindings.length).toBeGreaterThanOrEqual(1);
    });

    it('should include line number', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('\n\n<div>deep</div>\n'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.NoRawHtml);
      expect(finding).toBeDefined();
      expect(finding!.line).toBeDefined();
      expect(finding!.line).toBeGreaterThan(1);
    });
  });

  // --- no-script-tags ---

  describe('no-script-tags', () => {
    it('should report <script> tags', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('<script>alert("xss")</script>'));

      const findings = await checkMarkdown(input(tmp));

      const scriptFindings = findings.filter((f) => f.rule === Rule.NoScriptTags);
      expect(scriptFindings.length).toBeGreaterThanOrEqual(1);
      expect(scriptFindings[0].severity).toBe('error');
    });

    it('should report <script> with attributes', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('<script src="evil.js"></script>'));

      const findings = await checkMarkdown(input(tmp));

      const scriptFindings = findings.filter((f) => f.rule === Rule.NoScriptTags);
      expect(scriptFindings.length).toBeGreaterThanOrEqual(1);
    });

    it('should report event handler attributes', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('<img src="x" onerror="alert(1)">'));

      const findings = await checkMarkdown(input(tmp));

      const scriptFindings = findings.filter((f) => f.rule === Rule.NoScriptTags);
      expect(scriptFindings.length).toBeGreaterThanOrEqual(1);
      expect(scriptFindings.some((f) => f.title.includes('Event handler'))).toBe(true);
    });

    it('should not report script tags inside code blocks', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('```html\n<script>safe()</script>\n```'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoScriptTags)).toBeUndefined();
    });

    it('should report as error even in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('<script>alert("xss")</script>'));

      const findings = await checkMarkdown(input(tmp, false));

      const scriptFindings = findings.filter((f) => f.rule === Rule.NoScriptTags);
      expect(scriptFindings.length).toBeGreaterThanOrEqual(1);
      expect(scriptFindings[0].severity).toBe('error');
    });
  });

  // --- image-refs-relative ---

  describe('image-refs-relative', () => {
    it('should not report relative image refs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![alt](img/screenshot.png)'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ImageRefsRelative)).toBeUndefined();
    });

    it('should not report ./ prefixed image refs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![alt](./img/screenshot.png)'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ImageRefsRelative)).toBeUndefined();
    });

    it('should report absolute image paths', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![alt](/images/screenshot.png)'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.ImageRefsRelative);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
    });

    it('should include line number', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('\n\n![alt](/absolute/path.png)\n'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.ImageRefsRelative);
      expect(finding).toBeDefined();
      expect(finding!.line).toBeDefined();
      expect(finding!.line).toBeGreaterThan(1);
    });
  });

  // --- internal-links-relative ---

  describe('internal-links-relative', () => {
    it('should not report relative internal links', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('[other](./other.md)'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.InternalLinksRelative)).toBeUndefined();
    });

    it('should not report relative links without ./', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('[other](other.md)'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.InternalLinksRelative)).toBeUndefined();
    });

    it('should report absolute internal links', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('[other](/docs/other.md)'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.InternalLinksRelative);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
    });

    it('should report as warning in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('[other](/docs/other.md)'));

      const findings = await checkMarkdown(input(tmp, false));

      const finding = findings.find((f) => f.rule === Rule.InternalLinksRelative);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('warning');
    });

    it('should not report external links', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('[grafana](https://grafana.com)'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.InternalLinksRelative)).toBeUndefined();
    });

    it('should not report anchor links', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('[section](#my-section)'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.InternalLinksRelative)).toBeUndefined();
    });

    it('should not report mailto links', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('[email](mailto:test@example.com)'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.InternalLinksRelative)).toBeUndefined();
    });
  });

  // --- no-dangerous-urls ---

  describe('no-dangerous-urls', () => {
    it('should report javascript: URLs in links', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('[click](javascript:alert(1))'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.NoDangerousUrls);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
    });

    it('should report data: URLs in links', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('[click](data:text/html,<script>alert(1)</script>)'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.NoDangerousUrls);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
    });

    it('should report javascript: URLs in image refs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![xss](javascript:alert(1))'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.NoDangerousUrls);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
    });

    it('should report case-insensitive javascript: URLs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('[click](JavaScript:void(0))'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.NoDangerousUrls);
      expect(finding).toBeDefined();
    });

    it('should not report safe URLs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('[safe](https://example.com)\n[local](./page.md)'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoDangerousUrls)).toBeUndefined();
    });

    it('should not report dangerous URLs inside code blocks', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('```\n[click](javascript:alert(1))\n```'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoDangerousUrls)).toBeUndefined();
    });

    it('should report as error even in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('[click](javascript:alert(1))'));

      const findings = await checkMarkdown(input(tmp, false));

      const finding = findings.find((f) => f.rule === Rule.NoDangerousUrls);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
    });
  });

  // --- no-path-traversal ---

  describe('no-path-traversal', () => {
    it('should report ../ in image refs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![alt](../other/img/pic.png)'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.NoPathTraversal);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
    });

    it('should report ../ in links', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('[other](../parent/page.md)'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.NoPathTraversal);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
    });

    it('should report nested path traversal', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![alt](img/../../etc/passwd)'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.NoPathTraversal);
      expect(finding).toBeDefined();
    });

    it('should not report ./ prefix', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![alt](./img/pic.png)'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoPathTraversal)).toBeUndefined();
    });

    it('should not report path traversal inside code blocks', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('```\n![alt](../escape.png)\n```'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoPathTraversal)).toBeUndefined();
    });

    it('should report as error even in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![alt](../escape.png)'));

      const findings = await checkMarkdown(input(tmp, false));

      const finding = findings.find((f) => f.rule === Rule.NoPathTraversal);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
    });
  });

  // --- no-base64-images ---

  describe('no-base64-images', () => {
    it('should report base64-encoded images', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![pixel](data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==)'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.NoBase64Images);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
    });

    it('should report base64-encoded JPEG images', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![photo](data:image/jpeg;base64,/9j/4AAQ)'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.NoBase64Images);
      expect(finding).toBeDefined();
    });

    it('should not report normal image refs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![alt](img/screenshot.png)'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoBase64Images)).toBeUndefined();
    });

    it('should not report inside code blocks', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('```\n![pixel](data:image/png;base64,abc)\n```'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoBase64Images)).toBeUndefined();
    });

    it('should report as error even in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![pixel](data:image/png;base64,abc)'));

      const findings = await checkMarkdown(input(tmp, false));

      const finding = findings.find((f) => f.rule === Rule.NoBase64Images);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
    });
  });

  // --- no-external-images ---

  describe('no-external-images', () => {
    it('should report external image URLs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![logo](https://example.com/logo.png)'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.NoExternalImages);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
    });

    it('should report http:// image URLs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![logo](http://example.com/logo.png)'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.NoExternalImages);
      expect(finding).toBeDefined();
    });

    it('should report as warning in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![logo](https://example.com/logo.png)'));

      const findings = await checkMarkdown(input(tmp, false));

      const finding = findings.find((f) => f.rule === Rule.NoExternalImages);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('warning');
    });

    it('should not report local image refs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![alt](img/screenshot.png)'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoExternalImages)).toBeUndefined();
    });

    it('should not report external image URLs inside code blocks', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('```\n![logo](https://example.com/logo.png)\n```'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoExternalImages)).toBeUndefined();
    });

    it('should include line number', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('\n\n![logo](https://example.com/logo.png)\n'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.NoExternalImages);
      expect(finding).toBeDefined();
      expect(finding!.line).toBeDefined();
      expect(finding!.line).toBeGreaterThan(1);
    });
  });

  // --- cross-cutting concerns ---

  describe('multiple files', () => {
    it('should check all markdown files', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('<div>bad</div>'));
      await mkdir(join(tmp, 'sub'));
      await writeFile(join(tmp, 'sub', 'page.md'), md('<span>also bad</span>'));

      const findings = await checkMarkdown(input(tmp));

      const htmlFindings = findings.filter((f) => f.rule === Rule.NoRawHtml);
      expect(htmlFindings.length).toBeGreaterThanOrEqual(2);
      const files = htmlFindings.map((f) => f.file);
      expect(files).toContain('index.md');
      expect(files.some((f) => f?.includes('page.md'))).toBe(true);
    });
  });

  describe('multiple rules on same content', () => {
    it('should report both script tag and dangerous URL', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('<script>alert(1)</script>\n[click](javascript:void(0))'));

      const findings = await checkMarkdown(input(tmp));

      expect(findings.find((f) => f.rule === Rule.NoScriptTags)).toBeDefined();
      expect(findings.find((f) => f.rule === Rule.NoDangerousUrls)).toBeDefined();
    });
  });
});

describe('edge cases', () => {
  it('should not skip regular links when same pattern also appears as image ref on same line', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
    // ![x](../a) is an image ref (path traversal), [x](../a) is a regular link (path traversal)
    await writeFile(join(tmp, 'index.md'), md('![x](../a.png) [x](../a.md)'));

    const findings = await checkMarkdown(input(tmp));

    const traversal = findings.filter((f) => f.rule === Rule.NoPathTraversal);
    // should have TWO path traversal diagnostics: one from image ref, one from link
    expect(traversal).toHaveLength(2);
  });

  it('should report data:text/html URI in image ref as dangerous URL', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
    await writeFile(join(tmp, 'index.md'), md('![xss](data:text/html,<script>alert(1)</script>)'));

    const findings = await checkMarkdown(input(tmp));

    const finding = findings.find((f) => f.rule === Rule.NoDangerousUrls);
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('error');
    // should NOT be caught by no-base64-images (that's only for data:image/...;base64,...)
    expect(findings.find((f) => f.rule === Rule.NoBase64Images)).toBeUndefined();
  });
});
