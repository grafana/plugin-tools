---
id: plugin-protocol
title: Plugin protocol
description: Learn about the Grafana plugin protocol for plugin development.
keywords:
  - grafana
  - plugins
  - plugin
  - backend
  - plugin protocol
  - protocol
  - protobufs
  - protocal buffers
sidebar_position: 3
---

# Plugin backend communication protocol

The Grafana server uses a wire communication protocol to establish a contract between Grafana and the plugin's backend to allow them to communicate with each other. The plugin protocol lives in the [Grafana Plugin SDK for Go](grafana-plugin-sdk-for-go.md) because Grafana itself uses parts of the SDK as a dependency.

## Developing with the plugin protocol

:::note

Do not develop your plugin's backend directly against the protocol. Instead, use the [Grafana Plugin SDK for Go](grafana-plugin-sdk-for-go), which implements this protocol and provides higher-level APIs.

:::

If you choose to develop against the plugin protocol directly, you can do so using [Protocol Buffers](https://developers.google.com/protocol-buffers) (that is, protobufs) with [gRPC](https://grpc.io/). Grafana's plugin protocol protobufs are available in the [GitHub repository](https://github.com/grafana/grafana-plugin-sdk-go/blob/master/proto/backend.proto).

## Versioning

From time to time, Grafana will offer additions of services, messages, and fields in the latest version of the plugin protocol. We don't expect these updates to introduce any breaking changes. However, if we must introduce breaking changes to the plugin protocol, we'll create a new major version of the plugin protocol.

Grafana will release new major versions of the plugin protocol alongside new major Grafana releases. When this happens, we'll support both the old and the new plugin protocol for some time to make sure existing plugin backend components continue to work.

The plugin protocol attempts to follow Grafana's versioning. However, that doesn't mean we will automatically create a new major version of the plugin protocol when a new major release of Grafana is released.
