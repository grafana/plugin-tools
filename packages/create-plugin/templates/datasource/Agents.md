# {{ titleCase pluginName }} - Grafana Data Source Plugin

## Project Overview

A Grafana data source plugin that implements a `DataSourceApi`, query editor, and configuration editor for connecting to and querying external data systems.

---

## Project Structure

```
{{ pluginId }}/
  src/
    components/         # Config and Query editors
    datasource.ts       # DataSource implementation
    module.ts           # Plugin entry point
    plugin.json         # Plugin manifest
    types.ts            # TypeScript type definitions
    utils/              # Helper utilities
  tests/                # E2E tests
  provisioning/         # Grafana provisioning configs
package.json            # Dependencies and scripts
```

---

## Key Files

### Entry Points
- `src/module.ts` - Plugin module entry point, registers the data source with Grafana
- `src/plugin.json` - Plugin manifest containing metadata, requirements, and configuration

### Core Implementation
- `src/datasource.ts` - Implements the `DataSourceApi` methods (query, test, etc.)
- `src/components/QueryEditor.tsx` - UI for building queries
- `src/components/ConfigEditor.tsx` - UI for configuring the data source

### Types
- `src/types.ts` - TypeScript type definitions for query and options

### Configuration
- `package.json` - Dependencies, npm scripts, Node.js version requirements
- `tsconfig.json` - TypeScript compiler configuration
- `jest.config.js` - Jest test configuration
- `playwright.config.ts` - Playwright E2E test configuration
- `eslint.config.mjs` - ESLint configuration
- `docker-compose.yaml` - Local Grafana development instance

---

## Development

### Setup
```bash
npm install
```

### Development Commands
See `package.json` for all available scripts. Common commands:
- `npm run dev` - Watch mode with auto-rebuild
- `npm run server` - Start local Grafana instance
- `npm run build` - Production build
- `npm run test` - Run unit tests
- `npm run e2e` - Run E2E tests

---

## Finding Information

- **Dependencies & Scripts:** `package.json`
- **Plugin Configuration:** `src/plugin.json`
- **TypeScript Config:** `tsconfig.json`
- **Build Configuration:** `.config/webpack/`
- **Test Configuration:** `jest.config.js`, `playwright.config.ts`
- **Linting Rules:** `eslint.config.mjs`

---

## Notes

- Plugin scaffolds from Grafana plugin template
- Components follow standard React patterns
- See Grafana plugin documentation for framework-specific details


