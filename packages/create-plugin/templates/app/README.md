# Grafana app plugin template

This template is a starting point for building an app plugin for Grafana.

## What are Grafana app plugins?

App plugins can let you create a custom out-of-the-box monitoring experience by custom pages, nested data sources and panel plugins.

## Get started

{{#if hasBackend}}{{> backend-getting-started }}{{/if}}
{{> frontend-getting-started packageManagerName=packageManagerName }}

{{> distributing-your-plugin }}

## Learn more

Below you can find source code for existing app plugins and other related documentation.

- [Basic app plugin example](https://github.com/grafana/grafana-plugin-examples/tree/master/examples/app-basic#readme)
- [`plugin.json` documentation](https://grafana.com/developers/plugin-tools/reference/plugin-jsonplugin-json)
- [Sign a plugin](https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin)
