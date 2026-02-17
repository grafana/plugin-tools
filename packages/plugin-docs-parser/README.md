# @grafana/plugin-docs-parser

Lightweight library for parsing Grafana plugin documentation from markdown to HAST.

## Usage

```ts
import { parseMarkdown, toHtml } from '@grafana/plugin-docs-parser';

const { frontmatter, hast, headings } = parseMarkdown(markdownContent);
const html = toHtml(hast);

// with CDN asset rewriting
const result = parseMarkdown(markdownContent, {
  assetBaseUrl: 'https://cdn.example.com/my-plugin/1.0.0/docs',
});
```

For the CLI dev server, see [@grafana/plugin-docs-cli](../plugin-docs-cli).
