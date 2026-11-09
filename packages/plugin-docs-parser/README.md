# @grafana/plugin-docs-parser

Lightweight library for parsing Grafana plugin documentation from markdown to HAST.

## Usage

```ts
import { parseMarkdown } from '@grafana/plugin-docs-parser';
import { toHtml } from 'hast-util-to-html';

const { frontmatter, hast, headings } = parseMarkdown(markdownContent);
const html = toHtml(hast);

// with CDN asset rewriting
const result = parseMarkdown(markdownContent, {
  assetBaseUrl: 'https://cdn.example.com/my-plugin/1.0.0/docs',
});
```

## Snippets

A snippet is shared text that the parser keeps current. In a page, the text between `<!-- snippet:<name> -->` and `<!-- /snippet:<name> -->` is a fallback, and the parser replaces it with the snippet's current text. Pass `snippetValues` with the fields from the plugin's `plugin.json`, so snippets that show the plugin's name or ID can render:

```ts
const result = parseMarkdown(markdownContent, {
  snippetValues: { pluginName: 'My data source', pluginId: 'myorg-my-datasource' },
});
```

Values are filled in as plain text, so markdown in a plugin name isn't formatted.

A page keeps its fallback text when the parser doesn't know a snippet, when a value the snippet needs is missing or when the page's markers have a problem, such as a marker without its pair or a heading inside a snippet. So:

- Snippets are add-only. A snippet's text can change, but its name is never renamed or removed.
- Sites that render plugin docs update the parser before `create-plugin` scaffolds a new snippet. If one doesn't, the fallback text covers the gap.

## Markdown output

`toMarkdown` turns the `hast` from `parseMarkdown` back into GitHub-flavored Markdown, for sites that serve a Markdown version of each page to AI agents. Because it starts from the parsed tree, the Markdown matches the rendered page: snippets are swapped, raw HTML outside the allowlist is dropped, the h1 is removed and image paths are the ones `parseMarkdown` resolved.

```ts
import { parseMarkdown, toMarkdown } from '@grafana/plugin-docs-parser';

const pageUrl = 'https://grafana.com/grafana/plugins/my-plugin/docs/guides/setup';

const { hast } = parseMarkdown(markdownContent, { assetBaseUrl, file });
const markdown = toMarkdown(hast, {
  resolveHref: (href) => new URL(href, pageUrl).toString(),
});
```

`resolveHref` is called with the href of every link, as `parseMarkdown` left it, and returns the href to write. Use it to make doc links absolute. Resolve against the URL of the page itself, as a browser does, so that `#install` and links from pages in subfolders point to the right place. Without it, hrefs are written unchanged.

`toMarkdown` doesn't change the tree it's given, so one cached parse can feed both the HTML page and its Markdown version.

Parser-specific markup comes out as:

| Markup              | Markdown                                                                 |
| ------------------- | ------------------------------------------------------------------------ |
| Callout             | A GitHub alert, such as `> [!NOTE]`                                      |
| Collapsible section | `<details>` and `<summary>` around the body, as on GitHub                |
| YouTube embed       | A link to the video                                                      |
| Video               | A link to the video file                                                 |
| Footnote            | A GFM footnote, such as `[^1]`, numbered in the order the page uses them |

`toMarkdown` also works for a plugin README parsed with `parseMarkdown`. READMEs often use raw HTML, such as `<img>`, `<p align="center">` or `<a>`, and `parseMarkdown` drops those tags, so images and badges written as HTML don't appear in the output.

For the markdown this parser supports, see [Supported markdown](../plugin-docs-cli/docs/supported-markdown.md).

For the CLI dev server, see [@grafana/plugin-docs-cli](../plugin-docs-cli).
