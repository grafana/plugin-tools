---
id: creating-a-plugin
title: Creating a Plugin
---

To create a new Grafana plugin run the following command in your shell:

```shell
npx @grafana/create-plugin
```

:::info
The answers to the name, organization and type of plugin prompts will be combined to create the plugin directory name and the plugin id.

```
? What is going to be the name of your plugin? mongodb
? What is the organization name of your plugin? grafana
? What type of plugin would you like? datasource
```

In the above example this will result in the directory and plugin id being named `grafana-mongodb-datasource`
:::

## Prompts

When running the create command the following prompts will appear asking for confirmation before making changes:


### What is the name of your plugin?

The name of your plugin. This helps to identify its purpose.

### What is the organization name of your plugin?

Grafana plugins require an organization name (normally your [grafana account](https://grafana.com/signup/) username) to help uniquely identify your plugin.

### How would you describe your plugin?

Give your plugin a description. This will help users more easily understand what it does when the plugin is distributed.

### What type of plugin would you like?

Select from the following choices:

- **app** (Applications, or app plugins, create a custom out-of-the-box monitoring experience.)
- **datasource** (Data source plugins add support for new databases or external APIs.)
- **panel** (Add new visualizations to dashboards with panel plugins.)

Further information about the types of plugins can be found [here](https://grafana.com/docs/grafana/latest/administration/plugin-management/).

### Do you want a backend part of your plugin?

App and Datasource plugins can have a backend component written in goLang. Developing a backend to your plugin brings powerful features such as:

- Enable Grafana Alerting for data sources.
- Connect to non-HTTP services that normally can’t be connected to from a web browser, e.g. SQL database servers.
- Keep state between users, e.g. query caching for data sources.
- Use custom authentication methods and/or authorization checks that aren’t supported in Grafana.
- Use a custom data source request proxy, see [Resources](https://grafana.com/docs/grafana/latest/developers/plugins/backend/#resources).

### Do you want to add Github CI and Release workflows?

Add [github workflows](./ci.md) to your development cycle to help catch issues early or release your plugin to the community.

### Do you want to add a Github workflow for automatically checking "Grafana API compatibility" on PRs?

Add a [github workflow](./ci.md#compatibility-check-is-compatibleyml) to regularly check your plugin is compatibile with the latest version of Grafana.
