---
id: backend-plugins
title: Plugin backend system
description: Learn about the Grafana plugin backend system for extending the features of Grafana.
keywords:
  - grafana
  - plugins
  - plugin
  - backend
  - plugin system
sidebar_position: 1.5
---

# Plugin backend system

Introduced in Grafana v7.0, plugins with backend components allow you to integrate Grafana with virtually anything and offer custom visualizations. The plugin backend system is based on HashiCorp's [Go Plugin System over RPC](https://github.com/hashicorp/go-plugin) and supports server-side plugin elements. The Grafana server launches each plugin backend as a subprocess and communicates with it over [gRPC](https://grpc.io/).

:::note
A plugin with a backend requires a frontend component as well. For example, all data source plugins need a query editor component on the frontend.
:::

## Benefits of plugin backend development

Adding a backend component to your plugin has the following benefits:

- **Stability**: Plugins can't crash your Grafana process. A panic in a plugin doesn't panic the server.
- **Ease of development**: Grafana provides an officially supported SDK for Go and tooling to help create plugins.
- **Security**: Plugins only have access to the interfaces and arguments given to them, not to the entire memory space of the process.

## When to implement a plugin with a backend

Here's some common use cases for plugins with a backend component:

- Support [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/), [Recorded Queries](https://grafana.com/docs/grafana/latest/administration/recorded-queries/) and [Query and resource caching](https://grafana.com/docs/grafana/latest/administration/data-source-management/#query-and-resource-caching) for data sources.
- Connect to SQL database servers and other non-HTTP services that normally can't be connected to from a browser.
- Keep state between users, for example, by implementing custom caching for data sources.
- Use custom authentication methods and/or authorization checks that aren't supported in Grafana.
- Use a custom data source request proxy (refer to [Resources](#resources) for more information).

## Capabilities of the Grafana plugin backend system

Grafana's plugin backend system exposes several key capabilities, or building blocks, that your backend component can implement:

- [Query data](#query-data)
- [Resources](#resources)
- [Health checks](#health-checks)
- [Collect metrics](#collect-metrics)
- [Streaming](#streaming)

### Query data

The query data capability allows a plugin's backend to handle data source queries that are submitted from a [dashboard](https://grafana.com/docs/grafana/latest/dashboards), [Explore](https://grafana.com/docs/grafana/latest/explore) or [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting). The response contains [data frames](../data-frames), which are used to visualize metrics, logs, and traces.

:::note

To implement the query data capability you need a data source plugin backend.

:::

### Resources

The resources capability allows a plugin's backend to handle custom HTTP requests sent to the Grafana HTTP API and respond with custom HTTP responses. Here, the request and response formats can vary. For example, you can use JSON, plain text, HTML, or static resources such as images and files, and so on.

Compared to the query data capability, where the response contains data frames, the resources capability gives the plugin developer more flexibility for extending and opening up Grafana for new and interesting use cases.

#### Use cases for implementing resources:

- Implement a custom data source proxy to provide certain authentication, authorization, or other requirements that are not supported in Grafana's [built-in data proxy](https://grafana.com/docs/grafana/latest/developers/http_api/#data-source-proxy-calls).
- Return data or information in a format suitable for use within a data source query editor to provide auto-complete functionality.
- Return static resources such as images or files.
- Send a command to a device, such as a microcontroller or IoT device.
- Request information from a device, such as a microcontroller or IoT device.
- Extend Grafana's HTTP API with custom resources, methods and actions.
- Use [chunked transfer encoding](https://en.wikipedia.org/wiki/Chunked_transfer_encoding) to return large data responses in chunks or to enable certain streaming capabilities.

### Health checks

The health checks capability allows a plugin's backend to return the status of the plugin. For data source plugins' backends, the health check is automatically called when a user edits a data source and selects _Save & Test_ in the UI.

A plugin's health check endpoint is exposed in the Grafana HTTP API and allows external systems to continuously poll the plugin's health to make sure that it's running and working as expected.

### Collect metrics

A plugin's backend can collect and return runtime, process, and custom metrics using the text-based Prometheus [exposition format](https://prometheus.io/docs/instrumenting/exposition_formats/). If you're using the [Grafana Plugin SDK for Go](./grafana-plugin-sdk-for-go) to implement your plugin's backend, then the [Prometheus instrumentation library for Go applications](https://github.com/prometheus/client_golang) is built-in. This SDK gives you Go runtime metrics and process metrics out of the box. 

To add custom metrics to instrument your plugin's backend, refer to [Implement metrics in your plugin](../../how-to-guides/data-source-plugins/add-logs-metrics-traces-for-backend-plugins.md#implement-metrics-in-your-plugin).

### Streaming

The streaming capability allows a plugin's backend to handle data source queries that are streaming. For more information, refer to the tutorial for a [streaming data source plugin](../../tutorials/build-a-streaming-data-source-plugin.md).

## Data communication model

Grafana uses a communication model where you can opt in to instance management to simplify the development process. If you do, then all necessary information (configuration) is provided in each request to a plugin backend, allowing the plugin to fulfill the request and return a response. This model simplifies for plugin authors not having to keep track of or request additional state to fulfill a request.

## Caching and connection pooling

Grafana provides instance management as part of the plugin SDK to ease working with multiple configured Grafana data sources or apps, referred to as instances. This allows a plugin to simply keep state cleanly separated between instances. The SDK makes sure to optimize plugin resources by caching said instances in memory until their configuration changes in Grafana. Refer to the [Data source plugin backend tutorial](/tutorials/build-a-data-source-backend-plugin) or the [App with backend documentation](/how-to-guides/app-plugins/add-backend-component), which shows how to use the instance management for data source and app plugins.

Mentioned instance state is especially useful for holding client connections to downstream servers, such as HTTP, gRPC, TCP, UDP, and so on, to enable usage of connection pooling that optimizes usage and connection reuse to a downstream server. By using connection pooling, the plugin avoids using all of the machine's available TCP connections.
