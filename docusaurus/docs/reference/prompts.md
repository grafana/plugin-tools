---
id: prompts
title: Prompts
description: Reference for prompts of the create-plugin tool.
keywords:
  - grafana
  - plugins
  - plugin
  - create-plugin
  - prompts
sidebar_position: 40
---

# Prompts

When running the `create-plugin` command, the following prompts will appear.

### Select a plugin type

Select the type of plugin you would like to create:

- App (add custom pages, UI extensions and bundle other plugins)
- Data source (query data from a custom source)
- Panel (add a visualization for data or a widget)
- App with Scenes (create dynamic dashboards in app pages)

To learn more about the various types of plugins, refer to [Grafana plugin types and usage](../key-concepts/plugin-types-usage.md).

For more information on how Scenes allows you to create dashboard-like experiences in app plugins, see the [Scenes](https://grafana.com/developers/scenes) documentation.

### Add a backend to support server-side functionality? (y/N)

If you are creating an app or a data source plugin, you will be asked whether to additionally add a backend component.

Backend plugins offer powerful features such as:

- Enable [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/) for data sources.
- Connect to non-HTTP services to which a browser normally can’t connect. For example, SQL database servers.
- Keep state between users. For example, query caching for data sources.
- Use custom authentication methods and/or authorization checks that aren’t supported in Grafana.
- Use a custom data source request proxy.

To learn more, refer to [Backend plugins](../key-concepts/backend-plugins/index.md).

### Enter a name for your plugin

Give your plugin a name which helps identify its purpose.

### Enter your organization name (usually your Grafana Cloud org)

Enter the name of your organization. This must be your [Grafana Cloud](https://grafana.com/signup/) organization to allow you to [sign](../publish-a-plugin/sign-a-plugin.md) and optionally [publish](../publish-a-plugin/publish-or-update-a-plugin.md) the plugin to the [catalog](https://grafana.com/grafana/plugins).
Add a [GitHub workflow](/create-a-plugin/develop-a-plugin/set-up-github-workflows#the-compatibility-check-is-compatibleyml) to regularly check that your plugin is compatible with the latest version of Grafana.

## Bypassing Prompts

All the above prompts can be bypassed using cli arguments. To scaffold a plugin with cli arguments pass them to the create-plugin command like so:

```
npx @grafana/create-plugin --plugin-type="app" --plugin-name="myPlugin" --org-name="myorg" --backend
```

Scaffolding plugins using cli arguments not only makes it quicker to get started but allows you to run the tool in a non-interactive environment such as CI or to scaffold plugins with other tooling too.

:::info
To pass in false for a boolean create-plugin uses the naming convention `--no-<promptName>` (e.g. `--no-backend`).
:::

Please refer to the following table for the full list of prompt bypass options.

| Prompt           | Equivalent Argument Name     | Values                                             |
| ---------------- | ---------------------------- | -------------------------------------------------- |
| **Plugin Type**  | `--plugin-type`              | one of `app`, `datasource`, `panel` or `scenesapp` |
| **Backend**      | `--backend` / `--no-backend` | boolean                                            |
| **Name**         | `--plugin-name`              | string                                             |
| **Organization** | `--org-name`                 | string                                             |
