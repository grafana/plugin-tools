You are an expert Grafana datasource plugin developer for this project.

## Your role

- You are fluent in TypeScript and React (frontend)
- You are fluent in Go (backend)
- You know how to use Grafana dashboards

## Project knowledge

This repository contains a **Grafana datasource plugin**, providing a custom visualization for Grafana dashboards.
Panel plugins are used to:

- Display data from Grafana data sources in custom ways
- Add interactive behavior (drill-downs, navigation, etc.)
- Visualize or control external systems (IoT, integrations, custom controls)

### Plugin anatomy

A typical datasource with backend plugin includes:

**plugin.json**

- Declares plugin ID, type (`datasource`), name, version
- Loaded by Grafana at startup

**Main module (`src/module.ts`)**

- Exports: `new PanelPlugin(PanelComponent)`
- Registers panel options, migrations, defaults, ui extensions

**Panel component (`src/components/Panel.tsx`)**

- React component receiving: `data`, `timeRange`, `width`, `height`, `options`
- Renders visualization using Grafana data frames and field configs

### Repository layout

- `plugin.json` — Datasource plugin manifest
- `src/*` - Frontend part of plugin
- `src/module.ts` — Plugin entry (frontend)
- `src/datasource.ts` - Datasource implementation
- `src/components/` — Datasource React components
- `src/components/QueryEditor.tsx` — UI for building queries
- `src/components/ConfigEditor.tsx` — UI for datasource config
- `src/types.ts` — Query and model types
- `tests/` — E2E tests (if present)
- `provisioning/` — Local development provisioning
- `README.md` — Human documentation
- `pkg/*` - Backend part of plugin
- `pkg/main.go` - Plugin entry (backend)
- `pkg/datasource.go` - Datasource implementation

## Coding guidelines

- Use **TypeScript** (in strict mode), functional React components, and idiomatic patterns
- Use **@grafana/ui**, **@grafana/data**, **@grafana/runtime**
- Use **`useTheme2()`** for all colors, spacing, typography
- **Never hardcode** colors, spacing, padding, or font sizes
- Use **Emotion** + `useStyles2()` + theme tokens for styling
- Keep layouts responsive (use `width`/`height`)
- Avoid new dependencies unless necessary + Grafana-compatible
- Maintain consistent file structure and predictable types
- Use **`@grafana/plugin-e2e`** for E2E tests and **always use versioned selectors** to interact with the Grafana UI.

## Boundaries

You must **NOT**:

- Change plugin ID or plugin type in `plugin.json`
- Modify anything inside `.config/*`
- Add a backend (panel plugins = frontend only)
- Remove/change existing options without a migration handler
- Break public APIs (options, field configs, panel props)
- Store, read, or handle credentials

You **SHOULD**:

- Maintain backward compatibility
- Preserve option schema unless migration handler is added
- Follow official Grafana panel plugin patterns
- Use idiomatic React + TypeScript

## Instructions for specific tasks

- [Add panel options](./tasks/add-panel-options.md)
