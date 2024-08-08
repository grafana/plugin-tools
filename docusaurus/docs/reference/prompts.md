---
id: prompts
title: CLI Commands
description: Reference for commands available in the create-plugin tool.
keywords:
  - grafana
  - plugins
  - plugin
  - create-plugin
  - prompts
  - commands
sidebar_position: 40
---

# `create-plugin` commands

Below you can find the available commands in `@grafana/create-plugin`.

## Create a plugin

```
npx @grafana/create-plugin@latest
```

When calling the `create-plugin` tool **without any command** it's going to generate a new scaffold. You can either use CLI options to set the necessary information for generating a new plugin (e.g. name, org name, etc.), or you can let the tool drive you through the process.

### 1. Select a plugin type

```
? Select a plugin type …
❯ App (add custom pages, UI extensions and bundle other plugins)
  Data source (query data from a custom source)
  Panel (add a visualization for data or a widget)
  App with Scenes (create dynamic dashboards in app pages)
```

To learn more about the various types of plugins, refer to [Grafana plugin types and usage](../key-concepts/plugin-types-usage.md).

For more information on how Scenes allows you to create dashboard-like experiences in app plugins, see the [Scenes](https://grafana.com/developers/scenes) documentation.

### 2. Add a backend to support server-side functionality? (y/N)

If you are creating an app or a data source plugin, you will be asked whether to additionally add a backend component.

Backend plugins offer powerful features such as:

- Enable [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/) for data sources.
- Connect to non-HTTP services to which a browser normally can’t connect. For example, SQL database servers.
- Keep state between users. For example, query caching for data sources.
- Use custom authentication methods and/or authorization checks that aren’t supported in Grafana.
- Use a custom data source request proxy.

To learn more, refer to [Backend plugins](../key-concepts/backend-plugins/index.md).

### 3. Enter a name for your plugin

Give your plugin a name which helps identify its purpose.

### 4. Enter your organization name (usually your Grafana Cloud org)

Enter the name of your organization. This must be your [Grafana Cloud](https://grafana.com/signup/) organization. With the organization name you can [sign](../publish-a-plugin/sign-a-plugin.md) and optionally [publish](../publish-a-plugin/publish-or-update-a-plugin.md) the plugin to the [Grafana plugin catalog](https://grafana.com/grafana/plugins).

### Bypass prompts

You can bypass all the preceding prompts by using `create-plugin` CLI arguments. To scaffold a plugin with the CLI arguments, pass them to the `create-plugin` command like so:

```
npx @grafana/create-plugin \
  --plugin-type="app" \
  --plugin-name="myPlugin" \
  --org-name="myorg" \
  --backend
```

You can scaffold plugins using CLI arguments to get started faster. This also allows you to run the tool in a non-interactive environment such as CI or to scaffold plugins with other tooling.

Refer to the following table for the full list of prompt bypass options.

| Prompt           | Equivalent Argument Name     | Values                                             |
| ---------------- | ---------------------------- | -------------------------------------------------- |
| **Plugin type**  | `--plugin-type`              | one of `app`, `datasource`, `panel` or `scenesapp` |
| **Backend**      | `--backend` / `--no-backend` | boolean                                            |
| **Name**         | `--plugin-name`              | string                                             |
| **Organization** | `--org-name`                 | string                                             |
