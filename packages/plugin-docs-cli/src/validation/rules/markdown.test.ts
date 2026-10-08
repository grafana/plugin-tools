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

    it('should not report angle-bracket placeholders inside inline code as raw HTML', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('Published at `grafana.com/grafana/plugins/<slug>/docs/<page>`.'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoRawHtml)).toBeUndefined();
    });

    it('should still report real raw HTML on a line that also contains inline code', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('Use `<placeholder>` here <div>real html</div>'));

      const findings = await checkMarkdown(input(tmp));
      const htmlFindings = findings.filter((f) => f.rule === Rule.NoRawHtml);
      // one finding each for the opening <div> and closing </div> tag - the
      // masked `<placeholder>` span must not add a third
      expect(htmlFindings).toHaveLength(2);
      expect(htmlFindings.every((f) => f.detail.includes('<div>'))).toBe(true);
    });

    it('should still flag HTML when a backtick on the line is unterminated', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('`unclosed code <div>real</div>'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoRawHtml)).toBeDefined();
    });

    it('should not report HTML-looking text inside a double-backtick code span', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('Example: ``<a> with a ` backtick inside``'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoRawHtml)).toBeUndefined();
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

    it('should report unquoted event handler attributes', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('<details ontoggle=alert(1)>x</details>'));

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

    it('should not report a <script> tag mentioned inside inline code', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('Avoid adding a `<script>` tag directly to your page.'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoScriptTags)).toBeUndefined();
    });

    it('should not report an event handler attribute mentioned inside inline code', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('The `onclick="doSomething()"` attribute is set automatically.'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoScriptTags)).toBeUndefined();
    });

    it('should still report a real <script> tag on a line that also contains inline code', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('Use `<placeholder>` here <script>alert(1)</script>'));

      const findings = await checkMarkdown(input(tmp));
      const scriptFindings = findings.filter((f) => f.rule === Rule.NoScriptTags);
      expect(scriptFindings.length).toBeGreaterThanOrEqual(1);
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

  // --- no-hugo-shortcodes ---

  describe('no-hugo-shortcodes', () => {
    it('should report a paired shortcode once, with a replacement hint', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('{{< admonition type="note" >}}\nA note.\n{{< /admonition >}}\n'));

      const findings = await checkMarkdown(input(tmp));

      const shortcodeFindings = findings.filter((f) => f.rule === Rule.NoHugoShortcodes);
      expect(shortcodeFindings).toHaveLength(1);
      expect(shortcodeFindings[0].severity).toBe('error');
      expect(shortcodeFindings[0].line).toBe(5);
      expect(shortcodeFindings[0].detail).toContain('> [!NOTE]');
    });

    it('should not also report a shortcode as raw HTML', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(
        join(tmp, 'index.md'),
        md(
          '{{< figure src="/media/docs/x.png" caption="X" >}}\n\n{{< admonition type="note" >}}\nA note.\n{{< /admonition >}}\n'
        )
      );

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoRawHtml)).toBeUndefined();
    });

    it('should report {{% %}} shortcodes', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('{{% docs/shared lookup="x.md" source="grafana" %}}\n'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.NoHugoShortcodes);
      expect(finding).toBeDefined();
      expect(finding!.detail).toContain('Copy the shared content');
    });

    it('should name the shortcode in the message', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('{{< figure src="x.png" >}}\n'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoHugoShortcodes)!.detail).toMatch(/^The "figure" Hugo shortcode/);
    });

    it('should still report raw HTML after a single brace', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('Value: {<span>x</span>}\n'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoRawHtml)).toBeDefined();
    });

    it('should not report shortcodes in indented code blocks or HTML comments', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(
        join(tmp, 'index.md'),
        md('Hugo example:\n\n    {{< admonition type="note" >}}\n\n<!-- {{< youtube id="abc" >}} -->\n')
      );

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoHugoShortcodes)).toBeUndefined();
    });

    it('should give a generic hint for an unknown shortcode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('{{< card-grid key="cards" >}}\n'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoHugoShortcodes)!.detail).toContain('plain markdown');
    });

    it('should report as warning in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('{{< youtube id="abc" >}}\n'));

      const findings = await checkMarkdown(input(tmp, false));
      expect(findings.find((f) => f.rule === Rule.NoHugoShortcodes)!.severity).toBe('warning');
    });

    it('should not report shortcodes inside code blocks or inline code', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(
        join(tmp, 'index.md'),
        md('```\n{{< admonition type="note" >}}\n```\n\nHugo uses `{{< figure >}}` for images.\n')
      );

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoHugoShortcodes)).toBeUndefined();
    });
  });

  // --- valid-callout-marker ---

  describe('valid-callout-marker', () => {
    it('should not report valid callouts in any case', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('> [!NOTE]\n> Text.\n\n> [!caution]\n> Text.\n'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ValidCalloutMarker)).toBeUndefined();
    });

    it('should warn about an unknown callout type', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('> [!DANGER]\n> Text.\n'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.ValidCalloutMarker);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('warning');
      expect(finding!.line).toBe(5);
      expect(finding!.detail).toContain('NOTE, TIP, IMPORTANT, WARNING, CAUTION');
    });

    it('should warn when text follows the marker on the same line', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('> [!WARNING] This deletes data.\n'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.ValidCalloutMarker);
      expect(finding).toBeDefined();
      expect(finding!.title).toBe('Callout text on the marker line');
    });

    it('should warn when a marker is not on the first line of the blockquote', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('> [!NOTE]\n> Text.\n>\n> [!TIP]\n> More.\n'));

      const findings = await checkMarkdown(input(tmp));

      const markerFindings = findings.filter((f) => f.rule === Rule.ValidCalloutMarker);
      expect(markerFindings).toHaveLength(1);
      expect(markerFindings[0].line).toBe(8);
      expect(markerFindings[0].title).toBe('Callout marker not at the start of the quote');
    });

    it('should warn when a lazy continuation line comes before the marker', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('> Intro.\ncontinued\n> [!NOTE]\n> More.\n'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ValidCalloutMarker)?.title).toBe(
        'Callout marker not at the start of the quote'
      );
    });

    it('should not warn when a callout directly follows a paragraph', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('Some paragraph.\n> [!NOTE]\n> Text.\n'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ValidCalloutMarker)).toBeUndefined();
    });

    it('should not report markers inside indented code blocks', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('Example:\n\n    > [!DANGER] text\n'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ValidCalloutMarker)).toBeUndefined();
    });

    it('should not report markers inside code blocks', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('```markdown\n> [!DANGER] text\n```\n'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ValidCalloutMarker)).toBeUndefined();
    });
  });

  // --- no-url-placeholders ---

  describe('no-url-placeholders', () => {
    it('should report a version placeholder in a link URL and suggest latest', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(
        join(tmp, 'index.md'),
        md('Use [Explore](https://grafana.com/docs/grafana/<GRAFANA_VERSION>/explore/).\n')
      );

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.NoUrlPlaceholders);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
      expect(finding!.detail).toContain('<GRAFANA_VERSION>');
      expect(finding!.detail).toContain('"latest"');
    });

    it('should report other placeholders without the version hint', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('Open [your stack](https://<STACK_NAME>.grafana.net/).\n'));

      const findings = await checkMarkdown(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.NoUrlPlaceholders);
      expect(finding).toBeDefined();
      expect(finding!.detail).not.toContain('latest');
    });

    it('should report as warning in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(
        join(tmp, 'index.md'),
        md('[Explore](https://grafana.com/docs/grafana/<GRAFANA_VERSION>/explore/)\n')
      );

      const findings = await checkMarkdown(input(tmp, false));
      expect(findings.find((f) => f.rule === Rule.NoUrlPlaceholders)!.severity).toBe('warning');
    });

    it('should not report links in inline code or indented code blocks', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(
        join(tmp, 'index.md'),
        md(
          'Hugo writes `[Explore](https://grafana.com/docs/grafana/<GRAFANA_VERSION>/explore/)`.\n\n    [Explore](https://grafana.com/docs/grafana/<GRAFANA_VERSION>/explore/)\n'
        )
      );

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoUrlPlaceholders)).toBeUndefined();
    });

    it('should report a placeholder in an image URL', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![Diagram](img/<IMAGE_NAME>.png)\n'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoUrlPlaceholders)).toBeDefined();
    });

    it('should not report placeholders outside link URLs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(
        join(tmp, 'index.md'),
        md('Replace `<PASSWORD>` with your password.\n\n```yaml\nurl: <HOST>:5433\n```\n')
      );

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoUrlPlaceholders)).toBeUndefined();
    });
  });

  // --- valid-youtube-link ---

  describe('valid-youtube-link', () => {
    async function youtubeFindings(body: string) {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md(body));
      const findings = await checkMarkdown(input(tmp));
      return findings.filter((f) => f.rule === Rule.ValidYoutubeLink);
    }

    it('should not report a valid embed link', async () => {
      expect(await youtubeFindings('[Demo](https://www.youtube.com/watch?v=Qc83dSVe0vQ)\n')).toEqual([]);
      expect(await youtubeFindings('https://youtu.be/Qc83dSVe0vQ\n')).toEqual([]);
    });

    it('should warn when the video id is invalid', async () => {
      const findings = await youtubeFindings('Intro.\n\n[Demo](https://www.youtube.com/watch?v=short)\n\nOutro.\n');

      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe('warning');
      expect(findings[0].line).toBe(7);
    });

    it('should warn when a watch link has no id', async () => {
      expect(await youtubeFindings('[Demo](https://www.youtube.com/watch)\n')).toHaveLength(1);
    });

    it('should not report a link inside a sentence or a list', async () => {
      expect(await youtubeFindings('Watch [it](https://youtu.be/short) now.\n')).toEqual([]);
      expect(await youtubeFindings('- [Demo](https://youtu.be/short)\n')).toEqual([]);
    });

    it('should warn about a reference-style link with an invalid id', async () => {
      const findings = await youtubeFindings('[Demo][video]\n\n[video]: https://youtu.be/short\n');

      expect(findings).toHaveLength(1);
      expect(findings[0].line).toBe(5);
    });

    it('should not report a valid reference-style link', async () => {
      expect(await youtubeFindings('[video]\n\n[video]: https://youtu.be/Qc83dSVe0vQ\n')).toEqual([]);
    });

    it('should warn about a Shorts link with an invalid id', async () => {
      expect(await youtubeFindings('[Demo](https://www.youtube.com/shorts/short)\n')).toHaveLength(1);
    });

    it('should not report a channel link or a code block', async () => {
      expect(await youtubeFindings('[Channel](https://www.youtube.com/@grafana)\n')).toEqual([]);
      expect(await youtubeFindings('```md\n\n[Demo](https://youtu.be/short)\n\n```\n')).toEqual([]);
    });
  });

  // --- reference-style links ---

  describe('reference-style links', () => {
    it('should run link rules on reference definitions', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(
        join(tmp, 'index.md'),
        md(
          '[Explore][explore], [bad][bad], [out][out]\n\n[explore]: https://grafana.com/docs/grafana/<GRAFANA_VERSION>/explore/\n[bad]: javascript:alert(1)\n[out]: ../../outside.md\n'
        )
      );

      const findings = await checkMarkdown(input(tmp));

      expect(findings.find((f) => f.rule === Rule.NoUrlPlaceholders)?.line).toBe(7);
      expect(findings.find((f) => f.rule === Rule.NoDangerousUrls)?.line).toBe(8);
      expect(findings.find((f) => f.rule === Rule.NoPathTraversal)?.line).toBe(9);
    });

    it('should run image rules on definitions used by an image', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![Logo][logo]\n\n[logo]: https://example.com/logo.png\n'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoExternalImages)).toBeDefined();
      expect(findings.find((f) => f.rule === Rule.InternalLinksRelative)).toBeUndefined();
    });

    it('should not report footnote definitions or definitions in code', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(
        join(tmp, 'index.md'),
        md('Text.[^1]\n\n[^1]: /absolute/looking.md\n\n```\n[bad]: javascript:alert(1)\n```\n')
      );

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoDangerousUrls)).toBeUndefined();
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

    it('should allow ../ in links and images that stay inside the docs folder', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await mkdir(join(tmp, 'options'));
      await writeFile(join(tmp, 'options', 'legend.md'), md('[examples](../examples.md)\n\n![legend](../img/x.png)'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoPathTraversal)).toBeUndefined();
    });

    it('should leave root-relative refs with ../ to the relative-path rules', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('![x](/img/../../secret.png)\n\n[y](/img/../../secret.md)'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoPathTraversal)).toBeUndefined();
      expect(findings.find((f) => f.rule === Rule.ImageRefsRelative)).toBeDefined();
      expect(findings.find((f) => f.rule === Rule.InternalLinksRelative)).toBeDefined();
    });

    it('should report ../ from a nested page that leaves the docs folder', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await mkdir(join(tmp, 'options'));
      await writeFile(join(tmp, 'options', 'legend.md'), md('[outside](../../outside.md)\n\n![x](../../img/x.png)'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.NoPathTraversal)).toHaveLength(2);
    });

    it('should report ../ from the root index.md', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('[readme](../README.md)'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoPathTraversal)).toBeDefined();
    });

    it('should resolve ../ depth against the page location', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await mkdir(join(tmp, 'a', 'b'), { recursive: true });
      await writeFile(join(tmp, 'a', 'b', 'c.md'), md('![ok](../../img/x.png)\n\n![bad](../../../x.png)'));

      const findings = await checkMarkdown(input(tmp));
      const traversal = findings.filter((f) => f.rule === Rule.NoPathTraversal);
      expect(traversal).toHaveLength(1);
      expect(traversal[0].title).toBe('Path traversal in image reference');
    });

    it('should report percent-encoded traversal', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('[x](..%2Fsecret.md) [y](%2e%2e/secret.md)'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.NoPathTraversal)).toHaveLength(2);
    });

    it('should report traversal when another escape in the reference is malformed', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('[x](..%2Fsecret%ZZ.md)'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.find((f) => f.rule === Rule.NoPathTraversal)).toBeDefined();
    });

    it('should report backslash-rooted references', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'md-test-'));
      await writeFile(join(tmp, 'index.md'), md('[x](\\outside.md)\n\n![y](\\outside.png)'));

      const findings = await checkMarkdown(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.NoPathTraversal)).toHaveLength(2);
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
