# {{ titleCase pluginName }} - Grafana Panel Plugin

## Project Overview

A Grafana panel plugin that provides a simple visualization panel with customizable text display and series count indicator.

---

## Project Structure

```
{{ pluginId }}/
  src/
    components/         # React components
    module.ts           # Plugin entry point
    plugin.json         # Plugin manifest
    types.ts            # TypeScript type definitions
  tests/                # E2E tests
  provisioning/         # Grafana provisioning configs
package.json            # Dependencies and scripts
```

---

## Key Files

### Entry Points
- **`src/module.ts`** - Plugin module entry point, exports the panel component to Grafana
- **`src/plugin.json`** - Plugin manifest containing metadata, requirements, and configuration

### Configuration
- **`package.json`** - Dependencies, npm scripts, Node.js version requirements
- **`tsconfig.json`** - TypeScript compiler configuration
- **`jest.config.js`** - Jest test configuration
- **`playwright.config.ts`** - Playwright E2E test configuration
- **`eslint.config.mjs`** - ESLint configuration
- **`docker-compose.yaml`** - Local Grafana development instance

### Types
- **`src/types.ts`** - TypeScript type definitions for panel options

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