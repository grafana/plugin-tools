---
id: backend
title: Backend
---

The backpart part of a Grafana plugin is written in Go. It's always a good idea to keep the [Grafana plugin SDK for Go](https://grafana.com/docs/grafana/latest/developers/plugins/backend/grafana-plugin-sdk-for-go/) up to date:

```bash
go get -u github.com/grafana/grafana-plugin-sdk-go
go mod tidy
```

### `mage -v`

Build backend plugin binaries for Linux, Windows and Darwin.

### `mage -l`

List all available Mage targets for additional commands.
