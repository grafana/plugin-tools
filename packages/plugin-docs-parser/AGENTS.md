# AGENTS.md - plugin-docs-parser

Package-specific guidance. See the [repo-root AGENTS.md](../../AGENTS.md) for general conventions.

## What is in this package

- `src/` - `parseMarkdown`, the remark and rehype plugins it runs and the snippet text. `src/index.ts` is the
  public API.

## Contracts

Other tools depend on what this package returns, so changing it is a breaking change for them:

- The HAST that `parseMarkdown` returns, and its `frontmatter` and `headings`, are rendered by the plugin
  catalog.
- `Manifest`, `Page` and `Frontmatter` describe the `manifest.json` that `plugin-docs-cli build` writes. GCOM
  and the catalog read it.
- `plugin-docs-cli` depends on this package at an exact version, so a change here reaches it only after a release
  of both.

## Keep the guides in sync

The guides in `../plugin-docs-cli/docs/` are written for plugin authors. When the markdown the parser supports
changes, update [supported-markdown.md](../plugin-docs-cli/docs/supported-markdown.md) in the same change.

## Snippets

- Snippets are add-only. Never rename or remove one, because published docs use the name. Change its text instead.
- A snippet that needs a value shows its fallback text when the value is missing, so check the fallback in a page reads well on its own.
- Document a new snippet in [snippets.md](../plugin-docs-cli/docs/snippets.md).

## Sanitizing

Raw HTML is limited to `ALLOWED_HTML_TAGS`. Pick the side of `rehype-sanitize` in `src/parser.ts` by what a
plugin writes:

- A plugin that writes values from the page, such as ids or URLs, runs before it, so those values get sanitized.
  `rehypeSlug`, `rehypeRewriteAssetPaths` and `rehypeRewriteDocLinks` are examples.
- A plugin that adds the parser's own markup, such as callout classes or `<video>`, runs after it, so the
  markup survives and authors can't forge it. Anything it copies from the page must already be safe, the way
  `rehypeYouTube` builds its link from a validated video ID.
