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

For the CLI dev server, see [@grafana/plugin-docs-cli](../plugin-docs-cli).
