---
id: add-backend-component
title: Add a backend component to an app plugin
description: How to add a backend component to an app plugin
keywords:
  - grafana
  - plugins
  - plugin
  - app
  - backend
---

import CreatePlugin from '@shared/create-plugin-backend.md';
import BackendPluginAnatomy from '@shared/backend-plugin-anatomy.md';

Grafana app plugins allow you bundle panels and data sources. Apps also allow you to create custom pages in Grafana with complex functionality.

A backend component for an app plugin allows you to extend the app plugin for additional functionality such as custom authentication methods and integration with other services.

# Use cases for backend components in app plugins

- Use custom authentication methods and/or authorization checks that aren't supported in Grafana.
- Running workloads in the background
- Connect to non-HTTP services that normally can't be connected to from a browser

# Add a backend component to an app plugin

## Prerequisites

- Go ([Version](https://github.com/grafana/plugin-tools/blob/main/packages/create-plugin/templates/backend/go.mod#L3))
- [Mage](https://magefile.org/)
- [LTS](https://nodejs.dev/en/about/releases/) version of Node.js
- [Docker](https://docs.docker.com/get-docker/)

## Create a new app plugin

<CreatePlugin pluginType="app" />

## Anatomy of a backend plugin

<BackendPluginAnatomy pluginType="app" />

## Troubleshooting

### Grafana doesn't load my plugin

Ensure that Grafana has been started in development mode. If you are running Grafana from source, you'll need to add the following line to your `conf/custom.ini` file (if you don't have one already, go ahead and create this file before proceeding):

```ini
app_mode = development
```

You can then start Grafana in development mode by running `make run & make run-frontend` in the Grafana repository root.

If you are running Grafana from a binary or inside a Docker container, you can start it in development mode by setting the environment variable `GF_DEFAULT_APP_MODE` to `development`.

By default, Grafana requires backend plugins to be signed. To load unsigned backend plugins, you need to
configure Grafana to [allow unsigned plugins](https://grafana.com/docs/grafana/latest/administration/plugin-management/#allow-unsigned-plugins).
For more information, refer to [Plugin signature verification](https://grafana.com/docs/grafana/latest/administration/plugin-management/#backend-plugins).
