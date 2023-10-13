---
id: work-with-backend
title: Work with the backend
description: A guide to the Go commands frequently used in plugin development.
keywords:
  - grafana
  - plugins
  - plugin
  - go
  - CLI commands
sidebar_position: 2
---

Develop backend components for a Grafana plugin in [Go](https://go.dev/). The following commands are frequently used during backend plugin development:

## Update the Go SDK

To keep the [Grafana plugin SDK for Go](../../introduction/grafana-plugin-sdk-for-go) up to date:

```bash
go get -u github.com/grafana/grafana-plugin-sdk-go
go mod tidy
```

## Build plugin binaries

Build backend plugin binaries for Linux, Windows and Darwin:

| Option         | Description                                  | Example               |
| -------------- | -------------------------------------------- | --------------------- |
| `build:[arch]` | Builds a binary for a specific architecture. | `mage -v build:Linux` |

## List available Mage targets

List all available Mage targets for additional commands:

```bash
mage -l
```
