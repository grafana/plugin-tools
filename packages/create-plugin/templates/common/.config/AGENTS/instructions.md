---
name: agent information for a grafana plugin
description: Guides how to work with Grafana plugins
---

# Project knowledge

This repository contains a **Grafana plugin**. 

The official documentation for grafana plugins lives in https://grafana.com/developers/plugin-tools/ if you need to know how to use specific grafana APIs or grafana packages make sure to consult the official documentation. you can for example search and prefer results from https://grafana.com/developers/plugin-tools/

# Run, build and servers

* See `package.json` for scripts to run, build and serve the plugin frontend.
* See `Magefile.go` (if any) for scripts to run and build the plugin backend. Avoid modifying the Magefile.go as much as possible and use the default tools provided by the grafana go sdk.
* Generally the user runs the Grafana with the provided `docker-compose.yaml` file.

## Important direct documentation links

The following links contain indexes to more in-depth documentation. you can fetch the pages to find more information.

* how to package a plugin: https://grafana.com/developers/plugin-tools/publish-a-plugin/package-a-plugin
* how to sign a plugin: https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin
* general troubleshooting: https://grafana.com/developers/plugin-tools/troubleshooting
* Guides about app plugins: https://grafana.com/developers/plugin-tools/how-to-guides/app-plugins/
* Guides about data source plugins: https://grafana.com/developers/plugin-tools/how-to-guides/data-source-plugins/
* guides about panel plugins: https://grafana.com/developers/plugin-tools/how-to-guides/panel-plugins/
* general "how to" guides: https://grafana.com/developers/plugin-tools/how-to-guides/
* how nested plugins work (only for app plugins): https://grafana.com/developers/plugin-tools/how-to-guides/app-plugins/work-with-nested-plugins
* how to work with UI Extensions: https://grafana.com/developers/plugin-tools/how-to-guides/ui-extensions/
* plugin.json reference: https://grafana.com/developers/plugin-tools/reference/plugin-json
* `@grafana/ui` documentation: https://developers.grafana.com/ui/latest/index.html

# General guidelines for grafana plugins

## Coding guidelines

- Use **TypeScript** (in strict mode), functional React components, and idiomatic patterns
- Use **@grafana/ui** for UI React components over other UI libraries. 
- **Never hardcode** colors, spacing, padding, or font sizes. use variables from `@grafana/ui`
- Use **Emotion** + `useStyles2()` + theme tokens for styling, colors, spacing, typography
- Keep layouts responsive (use `width`/`height`). Remember this plugin frontend components might render in a mobile device.
- Keep dependencies to a minimum. Think twice before adding a new dependency.
- Maintain consistent file structure and predictable types
- Use **`@grafana/plugin-e2e`** npm package for E2E tests and **always use versioned selectors** to interact with the Grafana UI.
- Consult the official documentation for how to use specific grafana APIs or how-to guides. See the links in previous sections.

### Keep always in mind
- Maintain backward compatibility when doing changes to configuration forms, panel options and query editors
- Preserve query model schema unless migration handler is added
- Follow official Grafana plugin documentation (see the links in previous sections)
- Use idiomatic React + TypeScript
- Use secureJsonData to store credentials and secrets
- Use jsonData to store general user configuration inputs that are not secrets
- Use Grafana plugin SDK HTTP client in the backend
- Use `debug` or `error` level for logging
- Cache and reuse backend connections to external services
- if you need to modify a webpack configuration, prettier, eslint or other tool you can follow the guide on extend default configurations https://grafana.com/developers/plugin-tools/how-to-guides/extend-configurations
- Use default tools when possible: use the build tools provided by the grafana go sdk in Magefile.go over custom build commands, use webpack and only extend the configuration when necessary over of trying to recreate frontend build tools.
- Any modifications to `plugin.json` require a restart of the Grafana server. This is a hard requirement. Remind the user of restarting the Grafana server after doing changes to `plugin.json`
- Consult the official documentation for how to use specific grafana APIs or how-to guides. See the links in previous sections.


## Boundaries & Don'ts list:
- Do not change plugin ID or plugin type in `plugin.json`
- Do not modify anything inside the `.config` folder. the `.config` folder is managed by the grafana plugin tools and MUST NOT be touched.
- Do not Use the local file system
- Do not Use environment variables outside of unit tests
- Do not Execute arbitrary code in the backend
- Do not Log sensitive data
- Do not Use upstream Golang HTTP client in the backend
- Do not Use `info` level for logging
- Do not store sensitive information in jsonData
