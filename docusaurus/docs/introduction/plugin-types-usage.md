---
id: plugin-types-usage
title: Plugin types and usage
description: Learn about the different types of Grafana plugins, their usage and configuration.
keywords:
  - grafana
  - plugins
  - plugin
  - usage
  - provisioning
  - provision
  - configuration
  - configure
sidebar_position: 1
---

# Grafana plugin types and usage

:::note

This documentation discusses plugin configuration, provisioning, and usage for plugin developers. General information about plugin administration is available at [Plugin management](https://grafana.com/docs/grafana/latest/administration/plugin-management/).

:::

## Overview

Grafana plugin development allows for many options depending on the type of user experience you want to create. Whatever your need, there's a supported plugin type for your intended use:

- **Panel plugin** - a new way of visualizing data.
- **Data-source plugin** - a connection to a new database or other source of data.
- **App plugin** - an integrated out-of-the-box experience.

Refer to [Get started](../get-started/get-started.mdx) for instructions on how to quickly scaffold [each type](https://grafana.com/developers/plugin-tools/reference/prompts.md/#what-type-of-plugin-would-you-like) of plugin.

:::note

Don't open support tickets for topics related to plugin development. For help with plugin development, reach out to the [Community forums](https://community.grafana.com/c/plugin-development/30).

:::

## Panel (visualization) plugins

Development of panel plugins, also known as visualizations, allows Grafana to use custom visualizations, similar to existing plugins such the [Polystat](https://grafana.com/grafana/plugins/grafana-polystat-panel/) panel.

### Usage of panel plugins

Any installed plugin of type `panel` can be used, selected, and configured as a visualization within a dashboard.

Compared with data sources and apps, there’s currently no support for configuring visualizations on a [Grafana organization](https://grafana.com/docs/grafana/latest/administration/organization-management/#about-organizations) level.

:::note

With the recent introduction of [Grafana Scenes](https://grafana.com/developers/scenes), you can use any installed plugin of type `panel` as a visualization within a Scenes implementation.

:::

## Data source plugins

In plugin development, you can create new data source plugins to use Grafana with new databases, similar to existing plugins such as [MongoDB](https://grafana.com/grafana/plugins/grafana-mongodb-datasource/) or [Google BigQuery](https://grafana.com/grafana/plugins/grafana-bigquery-datasource/). Data source plugins may be added on the frontend and [the backend](./backend.md).

### Usage of data-source plugins

Create and configure a Grafana data source when you want to work with data provided by a third-party service for use in Grafana Dashboards, Explore, Alerting, and so on.

Given any installed plugin of type `datasource`, you can create and configure any number of data sources per [Grafana organization](https://grafana.com/docs/grafana/latest/administration/organization-management/#about-organizations). After you create zero to infinity data sources, they are persisted in Grafana's database.

:::note

To distinguish a Grafana data source from a data-source plugin, we sometimes refer to the latter as a _data-source instance_, that is, a configured Grafana data source with a `plugin id` type of `datasource`.

:::

### Global configuration of data source plugins

Use the Grafana configuration file to configure your app [`plugin_id`](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#pluginplugin_id).

:::info

Not all plugins support this type of configuration. Refer to the readme of specific plugins for details.

:::

### Provisioning of data sources

Data sources can also be provisioned using Grafana’s [provisioning features](https://grafana.com/docs/grafana/latest/administration/provisioning/#data-sources) so that you can define Grafana as-code as part of a GitOps approach when Grafana starts up or [on demand](https://grafana.com/docs/grafana/latest/developers/http_api/admin/#reload-provisioning-configurations).

Note that a plugin of type `datasource` must be installed before it can be provisioned.

### Bundling of dashboards

Data-source plugins can [include dashboards](https://grafana.com/developers/docs/reference/metadata.md#includes) by referencing dashboard JSON files (including `property` and `type=dashboard`) within the `plugin.json` file. Grafana puts a dashboard in the `General` folder when it is imported.

## App plugins

Development of app plugins, also known as apps or applications, allows you to create out-of-the-box solutions such as in the [Redis](https://grafana.com/grafana/plugins/redis-app/) app. You can optionally bundle data sources and panels, as well as provide custom pages, [Scenes](https://grafana.com/developers/scenes), and [UI extensions](../ui-extensions/).

### Usage of app plugins

Configure a Grafana app when you want to leverage or create a tailored monitoring view for a third-party service and optionally use custom pages or UI extensions. Given any installed plugin of type `app`, you can enable them once per [Grafana organization](https://grafana.com/docs/grafana/latest/administration/organization-management/#about-organizations) and they are persisted in Grafana’s database.

:::note

To distinguish a Grafana app from an app plugin, we sometimes refer to the latter as an _app instance_, that is, a configured Grafana app with a `plugin id` type of `app`.

:::

### Global configuration of app plugins

Use the [Grafana configuration file](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#configuration-file-location) to configure your app [`plugin_id`](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#pluginplugin_id).

:::info

Not all plugins support this type of configuration. Refer to the readme of specific plugins for details.

:::

### Provisioning of app plugins

Apps can also be provisioned using Grafana’s [provisioning features](https://grafana.com/docs/grafana/latest/administration/provisioning/#plugins) so that you can define Grafana as-code as part of a GitOps approach when Grafana starts up or [on demand](https://grafana.com/docs/grafana/latest/developers/http_api/admin/#reload-provisioning-configurations).

Note that the plugin must be installed before provisioning can succeed with a `plugin id` of `app` type.

### Bundling of apps

The app plugin type allows you to [nest other plugins inside it](../create-a-plugin/extend-a-plugin/nested-plugins); in other words, to bundle or [include](https://grafana.com/developers/docs/reference/metadata.md#includes) multiple plugins in the same package.

### Bundling of dashboards

App plugins can include dashboards by referencing dashboard JSON files within the `plugin.json` including `property` and `type=dashboard`. Grafana puts dashboards in the `General` folder when it is imported which will happen automatically when an app is enabled.
