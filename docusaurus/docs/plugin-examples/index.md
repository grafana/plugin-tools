---
id: plugin-examples
title: Grafana plugin examples
description: Sample plugins on GitHub for reference when building your own plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - samples
  - examples
---

Sample plugins give you insights into the structure, features, and implementation details of [several types](../introduction/plugin-types-usage.md) of Grafana plugins. These are real-world code examples that you can study and even reuse in your projects.

The following lists describe some of our popular plugins. For a complete list, see the [README](https://github.com/grafana/grafana-plugin-examples/tree/main#readme).

## Panel plugins

- [**panel-basic:**](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/panel-basic) This is a good starting point for creating a simple panel plugin to visualize data, navigate dashboards, or control devices.
- [**panel-frame-select:**](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/panel-frame-select) This example shows how to update panel options with values from a data query response.

## Data source plugins

- [**datasource-basic:**](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/datasource-basic) This app shows how to integrate a new data source including in-house metrics applications into a data source plugin.
- [**datasource-http-backend:**](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/datasource-http-backend) This app demonstrates how to query data from HTTP-based APIs, where the HTTP calls happen on the backend. Supports alerting.
- [**datasource-logs:**](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/datasource-logs) This app shows how to create a data source plugin with logging features.
- [**datasource-streaming:**](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/datasource-streaming-websocket) Update visualizations in real time using RxJS and WebSockets.

## App plugins

- [**app-basic:**](https://github.com/grafana/grafana-plugin-examples/blob/main/examples/app-basic/) This app plugin shows how to add fundamental features such as navigation, routing, styling, and configuration.
- [**app-with-backend:**](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/app-with-backend) This app plugin adds support for a backend including handling incoming HTTP requests.
- [**app-with-dashboards:**](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/app-with-dashboards) This example shows how to include pre-built dashboards with your app plugin.
- [**app-with-extension-point:**](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/app-with-extension-point) This example shows how to add a plugin extension point that can be extended by other plugins.
- [**app-with-scenes:**](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/app-with-scenes) Build a basic app plugin using the @grafana/scenes framework. This example shows examples of custom pages, nested data sources, and panel plugins.
