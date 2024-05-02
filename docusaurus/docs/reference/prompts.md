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

When running the `create-plugin` command, the following prompts appear:

### What is the name of your plugin?

Enter the name of your plugin. This helps to identify its purpose.

### What is the organization name of your plugin?

Enter the name of your organization. This is normally your [Grafana account](https://grafana.com/signup/) username which Grafana uses to help uniquely identify your plugin.

### How would you describe your plugin?

Give your plugin a description. This helps users more easily understand what it does when Grafana distributes the plugin.

### What type of plugin would you like?

Select from the following choices:

- **app**: Create a custom out-of-the-box monitoring experience.
- **datasource**: Add support for new databases or external APIs.
- **panel**: Add new visualizations to dashboards.
- **scenesapp**: Create Scenes applications or Scenes plugins. For more information on how Scenes allows you to create dashboard-like experiences in app plugins, see [Scenes](https://grafana.com/developers/scenes).

To learn more about the types of plugins, refer to the [plugin management guidelines](https://grafana.com/docs/grafana/latest/administration/plugin-management/).
To learn more about scenes, refer to the [Scenes documentation](https://grafana.com/developers/scenes).

### Do you want a backend part of your plugin?

App and data source plugins can have a backend component written in Go. Backend plugins offer powerful features such as:

- Enable [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/) for data sources.
- Connect to non-HTTP services to which a browser normally can’t connect. For example, SQL database servers.
- Keep state between users. For example, query caching for data sources.
- Use custom authentication methods and/or authorization checks that aren’t supported in Grafana.
- Use a custom data source request proxy. To learn more, refer to [Backend developer resources](../introduction/backend.md#resources).

### Do you want to add GitHub CI and Release workflows?

Add [GitHub workflows](/create-a-plugin/develop-a-plugin/set-up-github-workflows) to your development cycle to help catch issues early or release your plugin to the community.

### Do you want to add a GitHub workflow to automatically check Grafana API compatibility on PRs?

Add a [GitHub workflow](/create-a-plugin/develop-a-plugin/set-up-github-workflows#the-compatibility-check-is-compatibleyml) to regularly check that your plugin is compatible with the latest version of Grafana.
