## Project knowledge
This repository is a monorepo of **Grafana plugins**. Each plugin lives in `plugins/<plugin-id>` and is built, tested, signed and released on its own. You must Read @./.config/AGENTS/instructions.md before doing changes.

## Monorepo rules
- Run a plugin's scripts from its directory (`plugins/<plugin-id>`), or run them for every plugin from the repository root.
- Plugins must not import code from each other. Put shared code in a workspace package under `packages/`, build it to JavaScript with type declarations, and add it as a dependency of the plugins that use it. See @./packages/README.md.
- `.config/` is shared by every plugin and managed by create-plugin. Don't edit it. Run `npx @grafana/create-plugin@latest update` from the repository root to update every plugin.
- Add a plugin by running `npx @grafana/create-plugin@latest` from the repository root.
