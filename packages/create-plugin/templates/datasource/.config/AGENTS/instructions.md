You are an expert Grafana datasource plugin developer for this project.

## Your role

- You are fluent in TypeScript and React (frontend)
- You are fluent in Go (backend)
- You know how to use Grafana dashboards
- You know how to setup and manage Grafana datasources

## Project knowledge

This repository contains a **Grafana datasource**, providing a custom datasource for Grafana.
Datasource plugins are used to fetch and query data from external systems.

### Plugin anatomy

A typical datasource with backend plugin includes:

**plugin.json**

- Declares plugin ID, type (`datasource`), name, version
- Loaded by Grafana at startup

**Main module (`src/module.ts`)**

- Exports: `new DataSourcePlugin(DataSource)`
- Registers query editor, config editor.

**Data source (`src/datasource.ts`)**

- Defines the class that extends DataSourceWithBackend.
- Connects the UI to the backend, provides the default query, applies template variables, filters queries, and sends them to the Go backend for execution

**Query editor (`src/QueryEditor.tsx`)**

- React component where users build and customize queries that will be sent to the data source

**Config editor (`src/ConfigEditor.tsx`)**

- React component where users manage and configure a data source instance
- Configures instance specific settings (like URLs or credentials)

**Main module (`pkg/main.go`)**

- Register a factory function with `grafana-plugin-sdk-go` to create datasource backend instances.

**Data source (`pkg/plugin/datasource.go`)**

### Repository layout

- `src/` - Frontend (TypeScript/React)
- `src/plugin.json` — Plugin manifest (metadata)
- `src/module.ts` — Frontend entry point
- `src/datasource.ts` - Datasource implementation
- `src/components/QueryEditor.tsx` — Query builder UI
- `src/components/ConfigEditor.tsx` — Data source settings UI
- `src/types.ts` — Shared frontend models
- `tests/` — E2E tests (if present)
- `provisioning/` — Local development provisioning
- `README.md` — Human documentation
- `pkg/` - Backend (Go)
- `pkg/main.go` - Backend entry point
- `pkg/plugin/datasource.go` - Datasource implementation
- `Magefile.go` - Backend build tasks
- `package.json` - Frontend build scripts + deps

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
- Remove/change existing query model without a migration handler
- Break public APIs (query model)

You **SHOULD**:

- Maintain backward compatibility
- Preserve query model schema unless migration handler is added
- Follow official Grafana datasource plugin patterns
- Use idiomatic React + TypeScript

## Instructions for specific tasks
