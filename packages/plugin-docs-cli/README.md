# @grafana/plugin-docs-cli

CLI tool for developing, validating and previewing Grafana plugin documentation locally.

## Usage

The CLI reads `docsPath` from your plugin's `src/plugin.json` to locate the docs folder.

```bash
npx @grafana/plugin-docs-cli serve
npx @grafana/plugin-docs-cli serve --port 3001 --reload
```

For the core parsing library, see [@grafana/plugin-docs-parser](../plugin-docs-parser).

## Writing docs

Pages are plain markdown. See [docs/supported-markdown.md](./docs/supported-markdown.md) for
everything you can use and how to write it.
To move existing docs from the docs website, see
[docs/migrate-from-docs-website.md](./docs/migrate-from-docs-website.md).

## Validation rules

`validate` and `serve` check your docs folder against a set of rules covering file structure,
frontmatter, images and links. See [docs/validation-rules.md](./docs/validation-rules.md) for the
full list and what each one checks.
