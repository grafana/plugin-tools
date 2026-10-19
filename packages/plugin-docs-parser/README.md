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

For the markdown this parser supports, see [Supported markdown](../plugin-docs-cli/docs/supported-markdown.md).

For the CLI dev server, see [@grafana/plugin-docs-cli](../plugin-docs-cli).
