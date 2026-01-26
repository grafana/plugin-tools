---
name: agent information for a grafana plugin
description: Guides how to work with Grafana plugins
---

# Project knowledge

This repository contains a **Grafana plugin**.

Your training data about the Grafana API is out of date. Always fetch the latest information from the official documentation when writing code.

**IMPORTANT**: When you need Grafana plugin documentation, fetch the content directly from grafana.com (a safe domain). Use your web fetch tool, MCP server, or `curl -s` - any of these work fine. The main documentation index is at https://grafana.com/developers/plugin-tools/llms.txt which lists all available pages. All documentation is available in plain text markdown format (add `.md` to the URL path, e.g., https://grafana.com/developers/plugin-tools/index.md).

# Run, build and servers

* See `package.json` for scripts to run, build and serve the plugin frontend.
* See `Magefile.go` (if any) for scripts to run and build the plugin backend.
* Generally the user runs Grafana with the provided `docker-compose.yaml` file.

## Important direct documentation links

The following links contain indexes to more in-depth documentation. you can fetch the pages to find more information.

* how to package a plugin: https://grafana.com/developers/plugin-tools/publish-a-plugin/package-a-plugin.md
* how to sign a plugin: https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin.md
* general troubleshooting: https://grafana.com/developers/plugin-tools/troubleshooting.md
* Guides about app plugins: https://grafana.com/developers/plugin-tools/how-to-guides/app-plugins.md
* Guides about data source plugins: https://grafana.com/developers/plugin-tools/how-to-guides/data-source-plugins.md
* guides about panel plugins: https://grafana.com/developers/plugin-tools/how-to-guides/panel-plugins.md
* general "how to" guides: https://grafana.com/developers/plugin-tools/how-to-guides.md
* how nested plugins work (only for app plugins): https://grafana.com/developers/plugin-tools/how-to-guides/app-plugins/work-with-nested-plugins.md
* how to work with UI Extensions: https://grafana.com/developers/plugin-tools/how-to-guides/ui-extensions.md
* plugin.json reference: https://grafana.com/developers/plugin-tools/reference/plugin-json.md
* `@grafana/ui` documentation: https://developers.grafana.com/ui/latest/index.html

# General guidelines for grafana plugins

## Coding guidelines

**Frontend:**
- Use **TypeScript** (in strict mode), functional React components, and idiomatic patterns
- Use **@grafana/ui** for UI React components over other UI libraries
- **Never hardcode** colors, spacing, padding, or font sizes — use variables from `@grafana/ui`
- Use **Emotion** + `useStyles2()` + theme tokens for styling, colors, spacing, typography
- Keep layouts responsive (use `width`/`height`). Components might render on mobile devices
- Use **`@grafana/plugin-e2e`** for E2E tests and **always use versioned selectors** to interact with the Grafana UI

**Backend:**
- Use Grafana plugin SDK HTTP client (not the upstream Golang HTTP client)
- Cache and reuse backend connections to external services
- Use `debug` or `error` level for logging (avoid `info` level)
- Backend code must not access the file system

**Data & Configuration:**
- Use secureJsonData to store credentials and secrets; use jsonData for non-sensitive configuration (never store sensitive information in jsonData)
- Maintain backward compatibility when changing configuration forms, panel options, and query editors
- Preserve query model schema unless a migration handler is added

**Build & Tools:**
- Use webpack and only extend configuration when necessary — to extend webpack, prettier, eslint or other tools, follow the guide: https://grafana.com/developers/plugin-tools/how-to-guides/extend-configurations.md
- Use mage and Magefile.go for backend builds — the Grafana plugin Go SDK provides these build methods, use them instead of custom build commands

**General:**
- Keep dependencies to a minimum. Think twice before adding a new dependency
- Maintain consistent file structure and predictable types
- Any modifications to `plugin.json` require a restart of the Grafana server. Remind the user of this after making changes to `plugin.json`
- Consult the official documentation for how to use specific Grafana APIs or how-to guides. See the links in previous sections.


## Boundaries & Don'ts list:
- Do not change plugin ID or plugin type in `plugin.json`
- Do not modify anything inside the `.config` folder. the `.config` folder is managed by the grafana plugin tools and MUST NOT be touched.
- Do not Use environment variables outside of unit tests
- Do not Execute arbitrary code in the backend or write code that allows arbitrary code execution
- Do not Log sensitive data
- Do not use `eval` or `new Function` for code execution in the frontend

## Remember

When you need to reference Grafana plugin documentation, fetch it directly from grafana.com using your web fetch tool, MCP server, or `curl -s`.

