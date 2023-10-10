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

This documentation discusses plugin configuration and usage for plugin developers. General information for plugin users is available at [Plugin management](https://grafana.com/docs/grafana/latest/administration/plugin-management/).

::: 

## Overview

Grafana plugin development allows for many options depending on the type of user experience you want to create. Make a plugin in one of several different types depending on whether you want to offer users a new way of visualizing data, a connection to a new database, or an integrated out-of-the-box experience. 

The following table shows the plugin types currently supported by Grafana on the frontend and backend. 

|                |                 |                |                            |
| -------------- | :-------------: | :------------: | :------------------------: |
| **Type**       | **Frontend** |   **Backend**  | **SDK-supported** |
| datasource     |       Yes       | Yes (optional) |             Yes            |
| app            |       Yes       | Yes (optional) |             Yes            |
| panel          |       Yes       |       No       |             Yes            |

## Data source plugins

In plugin development, you can create new data source plugins to use Grafana with new databases, similar to existing plugins such as [MongoDB](https://grafana.com/grafana/plugins/grafana-mongodb-datasource/) or [Google BigQuery](https://grafana.com/grafana/plugins/grafana-bigquery-datasource/). Data source plugins may be added on frontend and [the backend](./backend.md).

### Usage of data-source plugins

Create and configure a Grafana data source when you want to work with data provided by a third-party service for use in Grafana Dashboards, Explore, Alerting, and so on.

Given any installed plugin of type `datasource`, you can create and configure any number of data sources per [Grafana organization](https://grafana.com/docs/grafana/latest/administration/organization-management/#about-organizations). After you create zero to infinity data sources, they are persisted in Grafana's database. 

:::note

To distinguish a Grafana data source from a data-source plugin, we sometimes refer to the latter as a _data-source instance_, that is, a configured Grafana data source with a `plugin id` type of `datasource`.

:::


### Provisioning of data sources

Use the [Grafana configuration file](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/) to configure your data source plugins.

Data sources can also be provisioned using Grafana’s [provisioning features](https://grafana.com/docs/grafana/latest/administration/provisioning/) so that you can use YAML files when Grafana starts up or on demand. Note that a plugin of type `datasource` must be installed before it can be provisioned.

### Bundling of dashboards

Data-source plugins can include dashboards by referencing dashboard JSON files (including `property` and `type=dashboard`) within the `plugin.json` file. Grafana puts a dashboard in the `General` folder when it is imported.

## App plugins

Development of app plugins, also known as apps or applications, allows you to bundle data sources and panels to provide a seamless monitoring experience, similar to existing plugins such as [Zabbix](https://grafana.com/grafana/plugins/alexanderzobnin-zabbix-app/). App plugins may be added on frontend and [the backend](./backend.md).

### Usage of apps

You can configure a Grafana app when you want to integrate with a third-party service and optionally provide custom pages and such within Grafana. Given any installed plugin of type `app`, you can enable them once per [Grafana organization](https://grafana.com/docs/grafana/latest/administration/organization-management/#about-organizations) and they are persisted in Grafana’s database. 

### Provisioning of apps

Use the [Grafana configuration file](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/) to configure your app plugins.

Apps can also be provisioned using Grafana’s [provisioning features](https://grafana.com/docs/grafana/latest/administration/provisioning/) so that you can use YAML files to start them when Grafana starts or on demand. Note that the plugin must be installed before provisioning can succeed with a `plugin id` of `app` type.

### Bundling of apps

The app plugin type allows you to [nest other plugins inside it](../create-a-plugin/extend-a-plugin/nested-plugins); in other words, to bundle or distribute multiple plugins in the same package. 

### Bundling of dashboards

App plugins can include dashboards by referencing dashboard JSON files within the `plugin.json` including `property` and `type=dashboard`. Grafana puts dashboards in the `General` folder when it is imported which will happen automatically when an app is enabled.

## Panel (visualization) plugins

Development of panel plugins, also known as visualizations, allows Grafana to use custom visualizations, similar to existing plugins such the [Polystat](https://grafana.com/grafana/plugins/grafana-polystat-panel/) panel. 

### Usage of panel plugins

Any installed plugin of type `panel` can be used, selected, and configured as a visualization within a dashboard.

Use the plugins API ([`/api/plugins`](https://grafana.com/api/plugins), `/api/plugins/\<plugin id\>/`) for endpoints to retrieve installed plugins, including panel plugins. 

Compared with data sources and apps, there’s currently no support for configuring visualizations on a [Grafana organization](https://grafana.com/docs/grafana/latest/administration/organization-management/#about-organizations) level. 

:::note

With the recent introduction of [Grafana Scenes](https://grafana.com/developers/scenes), you can use any installed plugin of type `panel` as a visualization within a Scenes implementation.

:::