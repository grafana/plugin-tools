## Project overview

This repository contains a Grafana panel plugin, which adds a custom visualization that can be used in Grafana dashboards. Panel plugins are useful when you want to:

- Present data from Grafana data source queries in a new or specialized way
- Add custom interactivity, such as navigation or drill-downs
- Visualize or control external systems (for example, IoT devices or custom integrations)

### High-level anatomy of a Grafana panel plugin

A typical panel plugin has:

- A plugin **manifest** (`plugin.json`)
  - Declares plugin ID, type (`panel`), name, version, and metadata
  - Picked up by Grafana during boot time to register plugin.

- A **main module** (usually `src/module.ts` or `src/module.tsx`)
  - Calls `new PanelPlugin(PanelComponent)` from `@grafana/data` and expose the instance from the module.
  - Optionally wires in the options editor, panel migration handler, and panel defaults

- A panel React component (e.g. `src/components/Panel.tsx`)
  - Renders the visualization
  - Receives props such as `data`, `timeRange`, `width`, `height`, and `options`
  - Works with Grafana data frames and field configuration APIs to read query results and settings.

## Goals for AI coding agents

When working on this project, AI agents should:

- Maintain the existing options schema unless a proper migration handler is implemented
- Follow idiomatic React and TypeScript practices consistent with Grafana’s official example plugins
- Treat AGENTS.md as the authoritative source—if anything in .config/AGENTS conflicts with this file, follow the instructions in AGENTS.md

## Repository layout (typical)

- `plugin.json` – Grafana plugin manifest (type: `panel`)
- `src/module.ts` – main plugin entry point (creates `PanelPlugin`)
- `src/components` – React components for the panel
- `src/types.ts` – TypeScript types for panel options and internal models
- `tests/` – End-to-end tests (if configured)
- `provisioning/` - Provisioning files used in the local development environment.
- `README.md` – Human-facing project documentation

## Coding guidelines

- Use **TypeScript** for all plugin code.
- Prefer **functional React components** and hooks.
- Use **Grafana UI components** (`@grafana/ui`) and **Grafana data APIs** (`@grafana/data`) or **Grafana runtime APIs** (`@grafana/runtime`) instead of custom UI or data abstractions whenever possible.
- Keep the panel responsive:
  - Respect `width` and `height` props.
  - Avoid fixed layout sizes that break in narrow panels or large screens.
- Avoid introducing new dependencies unless:
  - They’re necessary
  - They’re compatible with Grafana’s frontend environment and plugin guidelines
- If custom styling is needed, please using `Emotion`.

## Safety & constraints for agents

- Do **not** change `plugin.json` IDs or plugin type.
- Do **not** change anything in the `.config` folder.
- Do **not** add a backend to this plugin. A panel plugin is a frontend only plugin.
- Do **not** remove or break existing option fields without:
  - Adding a migration handler, or
  - Updating all usages and tests accordingly.
- Keep changes to public interfaces (options, field configs, panel props) backwards compatible where possible.
- When in doubt, mirror patterns from Grafana’s official panel plugin examples and docs.
