## Project overview

This repository contains a **Grafana panel plugin**, which means it adds a custom visualization type that can be used in Grafana dashboards alongside built-in panels.

In Grafana, panel plugins are used when you want to:

- Visualize data returned by Grafana data source queries in a new way.
- Provide custom interactivity (navigation, drill-down, etc.).
- Control or visualize the state of external systems (e.g. IoT, smart home, custom controls).

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

When modifying this project, AI agents should:

- Preserve option schema unless a migration handler is added.
- Prefer idiomatic React + TypeScript patterns used in Grafana’s example plugins

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
