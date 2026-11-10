import { describe, it, expect, vi } from 'vitest';
import { toHtml } from 'hast-util-to-html';
import { parseMarkdown, type ParseOptions } from './parser.js';
import { toMarkdown, type ToMarkdownOptions } from './markdown.js';

function convert(markdown: string, parseOptions?: ParseOptions, options?: ToMarkdownOptions): string {
  return toMarkdown(parseMarkdown(markdown, parseOptions).hast, options);
}

// whitespace between tags differs between the two parses, and the browser ignores it
function normalizeHtml(markdown: string, options?: ParseOptions): string {
  return toHtml(parseMarkdown(markdown, options).hast).replace(/\s*\n\s*/g, '');
}

describe('toMarkdown', () => {
  it('should return an empty string for an empty page', () => {
    expect(convert('')).toBe('');
  });

  it('should drop h1 headings and keep the rest', () => {
    expect(convert('# Page title\n\n## Section\n\nContent.')).toBe('## Section\n\nContent.\n');
  });

  it('should swap snippets the same way as the HTML', () => {
    const markdown = '<!-- snippet:enable-app -->\nOld text.\n<!-- /snippet:enable-app -->';

    const withValues = convert(markdown, { snippetValues: { pluginName: 'My app', pluginId: 'my-app' } });
    expect(withValues).toContain('To enable My app:');
    expect(withValues).toContain('1. Click **Administration**');
    expect(withValues).not.toContain('Old text.');
    expect(withValues).not.toContain('snippet:');

    expect(convert(markdown)).toBe('Old text.\n');
  });

  it('should drop raw HTML outside the allowlist and keep markdown inside it', () => {
    const output = convert('<div class="x">\n\nKept **text**.\n\n</div>\n\n<script>alert(1)</script>\n\nAfter.');

    expect(output).toBe('Kept **text**.\n\nAfter.\n');
  });

  it('should write images with the asset paths parseMarkdown resolved', () => {
    const output = convert('![Root](img/a.png)\n\n![Sub](./b.png)', {
      assetBaseUrl: 'https://cdn.example.com/my-plugin/1.0.0/docs',
      file: 'guides/setup.md',
    });

    expect(output).toBe(
      '![Root](https://cdn.example.com/my-plugin/1.0.0/docs/guides/img/a.png)\n\n' +
        '![Sub](https://cdn.example.com/my-plugin/1.0.0/docs/guides/b.png)\n'
    );
  });

  describe('links', () => {
    const markdown =
      '[Doc](configuration.md#auth) [Parent](../setup.md) [Ext](https://example.com/x?y=1) ' +
      '[Root](/grafana/plugins) [Frag](#install) [Mail](mailto:a@example.com)';

    it('should write hrefs unchanged without resolveHref', () => {
      expect(convert(markdown)).toBe(
        '[Doc](configuration#auth) [Parent](../setup) [Ext](https://example.com/x?y=1) ' +
          '[Root](/grafana/plugins) [Frag](#install) [Mail](mailto:a@example.com)\n'
      );
    });

    it('should pass every href to resolveHref and write what it returns', () => {
      const resolveHref = vi.fn((href: string) => `https://grafana.com/docs/${href}`);

      const output = convert(markdown, undefined, { resolveHref });

      expect(resolveHref.mock.calls.map(([href]) => href)).toEqual([
        'configuration#auth',
        '../setup',
        'https://example.com/x?y=1',
        '/grafana/plugins',
        '#install',
        'mailto:a@example.com',
      ]);
      expect(output).toContain('[Doc](https://grafana.com/docs/configuration#auth)');
      expect(output).toContain('[Frag](https://grafana.com/docs/#install)');
    });

    it('should pass hrefs of reference-style links to resolveHref', () => {
      const output = convert('[Doc][ref]\n\n[ref]: setup.md', undefined, { resolveHref: (href) => `/abs/${href}` });

      expect(output).toBe('[Doc](/abs/setup)\n');
    });

    it('should not pass image srcs to resolveHref', () => {
      const resolveHref = vi.fn((href: string) => href);

      convert('![Alt](https://cdn.example.com/a.png)', undefined, { resolveHref });

      expect(resolveHref).not.toHaveBeenCalled();
    });
  });

  describe('callouts', () => {
    it('should write a callout as a GitHub alert', () => {
      expect(convert('> [!WARNING]\n> Back up **first**.\n>\n> - one\n> - two')).toBe(
        '> [!WARNING]\n> Back up **first**.\n>\n> - one\n> - two\n'
      );
    });

    it('should write a callout whose body starts with a list', () => {
      expect(convert('> [!TIP]\n>\n> - one')).toBe('> [!TIP]\n>\n> - one\n');
    });

    it('should write a callout with only a title', () => {
      expect(convert('> [!NOTE]')).toBe('> [!NOTE]\n');
    });

    it('should leave a quote with an unknown marker as a quote', () => {
      expect(convert('> [!FOO]\n> Text.')).toBe('> \\[!FOO] Text.\n');
    });

    it('should not turn a plain quote into a callout', () => {
      expect(convert('> Plain quote.')).toBe('> Plain quote.\n');
    });
  });

  describe('collapsible sections', () => {
    it('should keep details and summary as HTML around the markdown body', () => {
      expect(convert('<details>\n<summary>More   info</summary>\n\nHidden *text*.\n\n</details>')).toBe(
        '<details>\n<summary>More info</summary>\n\nHidden _text_.\n\n</details>\n'
      );
    });

    it('should keep the open attribute', () => {
      expect(convert('<details open><summary>Shown</summary>\n\nBody.\n\n</details>')).toBe(
        '<details open>\n<summary>Shown</summary>\n\nBody.\n\n</details>\n'
      );
    });

    it('should escape HTML in the summary text', () => {
      expect(convert('<details>\n<summary>a &lt; b</summary>\n\nBody.\n\n</details>')).toContain(
        '<summary>a &lt; b</summary>'
      );
    });

    it('should write details without a summary', () => {
      expect(convert('<details>\n\nBody.\n\n</details>')).toBe('<details>\n\nBody.\n\n</details>\n');
    });
  });

  describe('embeds', () => {
    it('should write a YouTube embed as a link to the video', () => {
      expect(convert('[Demo](https://youtu.be/dQw4w9WgXcQ)')).toBe(
        '[Demo](https://www.youtube.com/watch?v=dQw4w9WgXcQ)\n'
      );
    });

    it('should write a video as a link to the file', () => {
      expect(convert('![Panel demo](demo.mp4 "A title")', { assetBaseUrl: 'https://cdn.example.com/docs' })).toBe(
        '[Panel demo](https://cdn.example.com/docs/demo.mp4)\n'
      );
    });

    it('should keep an image inside a link', () => {
      expect(convert('[![Badge](https://example.com/b.png)](https://example.com)')).toBe(
        '[![Badge](https://example.com/b.png)](https://example.com)\n'
      );
    });
  });

  it('should write footnotes as GFM footnotes without back-references', () => {
    const output = convert('One[^a] and two[^b] and one again[^a].\n\n[^a]: First.\n\n[^b]: Second.');

    expect(output).toBe('One[^1] and two[^2] and one again[^1].\n\n[^1]: First.\n\n[^2]: Second.\n');
  });

  it('should write GFM tables, task lists, breaks, rules and code', () => {
    const markdown =
      '| a | b |\n|:-|-:|\n| 1 | 2 |\n\n- [x] done\n- [ ] todo\n\nline one<br>line two\n\n---\n\n```ts\nconst a = 1;\n```';

    expect(convert(markdown)).toBe(
      '| a  |  b |\n| :- | -: |\n| 1  |  2 |\n\n- [x] done\n- [ ] todo\n\nline one\\\nline two\n\n---\n\n```ts\nconst a = 1;\n```\n'
    );
  });

  it('should keep breaks in table cells and headings as br tags', () => {
    expect(convert('| a |\n|-|\n| one<br>two |\n\n### Three<br>four')).toBe(
      '| a          |\n| ---------- |\n| one<br>two |\n\n### Three<br>four\n'
    );
  });

  it('should not change the hast it is given', () => {
    const { hast } = parseMarkdown(
      '> [!NOTE]\n> Body.\n\nText[^1].\n\n[^1]: Note.\n\n<details><summary>S</summary>\n\nB\n\n</details>'
    );
    const before = structuredClone(hast);

    toMarkdown(hast, { resolveHref: (href) => `/x/${href}` });

    expect(hast).toEqual(before);
  });

  it('should produce markdown that parses back to the same page', () => {
    const options: ParseOptions = {
      assetBaseUrl: 'https://cdn.example.com/docs',
      file: 'guides/page.md',
      snippetValues: { pluginName: 'My app', pluginId: 'my-app' },
    };
    const markdown = `# Title

Intro with a [link](configuration.md#auth), \`code\`, _emphasis_ and a note[^1].

![Screenshot](./img/a.png)

> [!NOTE]
> Body **bold**.

> [!CAUTION]

> Plain quote

<details open>
<summary>More info</summary>

Hidden text.

</details>

https://www.youtube.com/watch?v=dQw4w9WgXcQ

<!-- snippet:enable-app -->
Fallback.
<!-- /snippet:enable-app -->

| a | b |
|:-|-:|
| 1 | 2<br>3 |

- [x] done
- [ ] todo

1. First
1. Second

line one<br>line two

---

\`\`\`ts
const a = 1;
\`\`\`

[^1]: The note.
`;

    const output = convert(markdown, options);

    expect(normalizeHtml(output, options)).toBe(normalizeHtml(markdown, options));
  });
});
