# @grafana/plugin-docs-cli

CLI tool for developing, validating and previewing Grafana plugin documentation locally.

## Usage

The CLI reads `docsPath` from your plugin's `src/plugin.json` to locate the docs folder.

```bash
npx @grafana/plugin-docs-cli serve
npx @grafana/plugin-docs-cli serve --port 3001 --reload
```

For the core parsing library, see [@grafana/plugin-docs-renderer](../plugin-docs-renderer).
