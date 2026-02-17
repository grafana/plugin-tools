# @grafana/plugin-docs-renderer

Lightweight library for parsing Grafana plugin documentation from markdown to HTML.

## Usage

```ts
import { parseMarkdown } from '@grafana/plugin-docs-renderer';

const { frontmatter, html, headings } = parseMarkdown(markdownContent);

// with CDN asset rewriting
const result = parseMarkdown(markdownContent, {
  assetBaseUrl: 'https://cdn.example.com/my-plugin/1.0.0/docs',
});
```

For the CLI dev server, see [@grafana/plugin-docs-cli](../plugin-docs-cli).
