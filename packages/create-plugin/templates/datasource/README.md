# Grafana data source plugin template

This template is a starting point for building a Data Source Plugin for Grafana.

## What are Grafana data source plugins?

Grafana supports a wide range of data sources, including Prometheus, MySQL, and even Datadog. There’s a good chance you can already visualize metrics from the systems you have set up. In some cases, though, you already have an in-house metrics solution that you’d like to add to your Grafana dashboards. Grafana Data Source Plugins enables integrating such solutions with Grafana.

## Getting started

{{#if hasBackend}}{{> backend-getting-started }}{{/if}}
{{> frontend-getting-started packageManagerName=packageManagerName }}

{{> distributing-your-plugin }}

## Learn more

Below you can find source code for existing app plugins and other related documentation.

- [Basic data source plugin example](https://github.com/grafana/grafana-plugin-examples/tree/master/examples/datasource-basic#readme)
- [`plugin.json` documentation](https://grafana.com/developers/plugin-tools/reference/plugin-json)
- [How to sign a plugin?](https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin)
