# Project overview

This repository contains a **Grafana panel plugin**, providing a custom visualization for Grafana dashboards.
Panel plugins are used to:

- Display data from Grafana data sources in custom ways
- Add interactive behavior (drill-downs, navigation, etc.)
- Visualize or control external systems (IoT, integrations, custom controls)

---

# Plugin anatomy

A typical panel plugin includes:

## **plugin.json**

- Declares plugin ID, type (`panel`), name, version
- Loaded by Grafana at startup

## **Main module (`src/module.ts`)**

- Exports: `new PanelPlugin(PanelComponent)`
- Registers panel options, migrations, defaults, extensions (links, components)

## **Panel component (`src/components/Panel.tsx`)**

- React component receiving: `data`, `timeRange`, `width`, `height`, `options`
- Renders visualization using Grafana data frames and field configs

---

# Agent goals

Agents must:

- Preserve the existing options schema unless adding a migration handler
- Follow idiomatic React + TypeScript patterns used in official Grafana examples
- Treat **`AGENTS.md` as the authoritative source** over `.config/AGENTS/*`

---

# Repository layout

- `plugin.json` — Panel plugin manifest
- `src/module.ts` — Main plugin entry
- `src/components/` — Panel React components
- `src/types.ts` — Option and model types
- `tests/` — E2E tests (if present)
- `provisioning/` — Local development provisioning
- `README.md` — Human documentation

---

# Coding guidelines

- Use **TypeScript** and **functional React components**
- Use **@grafana/ui**, **@grafana/data**, **@grafana/runtime**
- Respect `width` and `height`; keep layout responsive
- Avoid unnecessary dependencies; ensure Grafana compatibility
- Use useTheme2() from @grafana/ui for visual tokens
- Avoid to hardcode colors, spacing, padding, or font sizes
- Follow existing file structure
- Keep code typed and predictable

---

# Safety & constraints

Agents must **not**:

- Change plugin IDs or plugin type in `plugin.json`
- Modify anything under `.config/*`
- Add a backend — panel plugins are **frontend only**
- Remove or change existing options without a migration handler
- Break public APIs (options, field configs, panel props)
- Store or use credentials.

Agents **should**:

- Keep the plugin backward compatible
- Mirror patterns from Grafana’s official panel plugin examples

---

# How-to

- [How-to add panel options](./howto/add-panel-options.md)
