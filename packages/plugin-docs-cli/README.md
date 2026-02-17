# @grafana/plugin-docs-cli

CLI tool for developing, validating, and previewing Grafana plugin documentation locally.

## Status

🚧 Work in progress - Package structure created, implementation in progress.

## Purpose

This package provides developer tooling for plugin documentation:

- 🚀 Local preview server with hot reload
- ✅ Validation (coming soon)
- 📦 Manifest generation from filesystem

For the core parsing library, see [@grafana/plugin-docs-renderer](../plugin-docs-renderer).

## Usage

```bash
# Using npx (no installation required)
npx @grafana/plugin-docs-cli serve ./docs

# Or install globally
npm install -g @grafana/plugin-docs-cli
@grafana/plugin-docs-cli serve ./docs
```
