---
id: backend-plugins
title: Backend plugins
description: Learn about the Grafana backend plugin system for extending the features of Grafana.
keywords:
  - grafana
  - plugins
  - plugin
  - backend
  - plugin system
sidebar_position: 1
---

# Backend plugins

The Grafana plugin system for backend development allows you to integrate Grafana with virtually anything and offer custom visualizations. The system is based on HashiCorp's [Go Plugin System over RPC](https://github.com/hashicorp/go-plugin). Our implementation of the Grafana server launches each backend plugin as a subprocess and communicates with it over [gRPC](https://grpc.io/).

This document explains the system's background, use cases, benefits, and key features.

## Background

Grafana added support for _frontend plugins_ in version 3.0 so that the Grafana community could create custom panels and data sources. It was wildly successful and has made Grafana much more useful for our user community.

However, one limitation of these plugins is that they run on the client side, in the browser. Therefore, they can't support use cases that require server-side features.

Since Grafana v7.0, we have supported server-side plugins that remove this limitation. We use the term _backend plugin_ to denote that a plugin has a backend component. A backend plugin usually requires frontend components as well. For example, some backend data source plugins need query editor components on the frontend.

## Use cases for implementing a backend plugin

The following examples give some common use cases for backend plugins:

- Enable [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/) for data sources.
- Connect to SQL database servers and other non-HTTP services that normally can't be connected to from a browser.
- Keep state between users, for example, by query caching for data sources.
- Use custom authentication methods and/or authorization checks that aren't supported in Grafana.
- Use a custom data source request proxy (refer to [Resources](#resources) for more information).

## Benefits for plugin development

Grafana's approach has benefits for developers:

- **Stability:** Plugins can't crash your Grafana process: a panic in a plugin doesn't panic the server.
- **Ease of development:** Grafana provides an officially supported SDK for Go and tooling to help create plugins.
- **Security:** Plugins only have access to the interfaces and arguments given to them, not to the entire memory space of the process.

## Capabilities of the backend plugin system

Grafana's backend plugin system exposes several key capabilities, or building blocks, that your backend plugin can implement:

- Query data
- Resources
- Health checks
- Collect metrics
- Streaming

### Query data

The query data capability allows a backend plugin to handle data source queries that are submitted from a [dashboard](https://grafana.com/docs/grafana/latest/dashboards), [Explore](https://grafana.com/docs/grafana/latest/explore) or [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting). The response contains [data frames](https://grafana.com/docs/grafana/latest/developers/plugins/introduction-to-plugin-development/data-frames/), which are used to visualize metrics, logs, and traces.

:::note

Backend data source plugins are required to implement the query data capability.

:::

### Resources

The resources capability allows a backend plugin to handle custom HTTP requests sent to the Grafana HTTP API and respond with custom HTTP responses. Here, the request and response formats can vary. For example, you can use JSON, plain text, HTML, or static resources such as images and files, and so on.

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

The health checks capability allows a backend plugin to return the status of the plugin. For data source backend plugins, the health check is automatically called when a user edits a data source and selects _Save & Test_ in the UI.

A plugin's health check endpoint is exposed in the Grafana HTTP API and allows external systems to continuously poll the plugin's health to make sure that it's running and working as expected.

### Collect metrics

A backend plugin can collect and return runtime, process, and custom metrics using the text-based Prometheus [exposition format](https://prometheus.io/docs/instrumenting/exposition_formats/). If you're using the [Grafana Plugin SDK for Go](./grafana-plugin-sdk-for-go.md) to implement your backend plugin, then the [Prometheus instrumentation library for Go applications](https://github.com/prometheus/client_golang) is built-in. This SDK gives you Go runtime metrics and process metrics out of the box. You can use the [Prometheus instrumentation library](https://github.com/prometheus/client_golang) to add custom metrics to instrument your backend plugin.

The Grafana HTTP API offers an endpoint (`/api/plugins/<plugin id>/metrics`) that allows you to configure a Prometheus instance to scrape the metrics.

### Streaming

The streaming capability allows a backend plugin to handle data source queries that are streaming. For more information, refer to [Build a streaming data source plugin](https://grafana.com/docs/grafana/latest/developers/plugins/create-a-grafana-plugin/develop-a-plugin/build-a-streaming-data-source-plugin/).

## Data communication model

When communicating with backend plugins, Grafana should provide all the necessary information (configuration) in each request to allow the plugin to fulfill the request and return a response. This is a simple model for ensuring data communication between Grafana and plugin. 

However, there are cases when a Grafana plugin or data source has been configured with sensitive information that is stored encrypted in Grafana’s database. In such cases, Grafana will decrypt the sensitive data and attach it in clear text in messages to the plugin upon each request to their respective backends.

## Caching and connection pooling

Grafana uses instance management (that is, caching) in the backend plugin SDK to optimize plugin resources. It works by caching parts of the plugin (including `jsonData` and `secureJSONData`) in memory so that subsequent requests can benefit from not having to reinitialize the plugin instance, where the instance is intended to hold things such as HTTP clients, connection pools, decrypted secrets, and so on. 

Connection pooling allows a plugin instance to reuse connections to a downstream server so that it doesn't use all of the machine's available TCP connections. Plugin developers must implement connection pooling properly to avoid having a detrimental effect on performance in multitenant environments such as Grafana Cloud.