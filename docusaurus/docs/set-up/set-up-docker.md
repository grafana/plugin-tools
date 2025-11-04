---
id: set-up-docker
title: Set up your Docker development environment
sidebar_label: Set up your Docker environment
description: Set up Docker for Grafana plugin development.
keywords:
  - grafana
  - plugins
  - plugin
  - create-plugin
  - Docker
  - setup
  - CI
  - continuous integration
  - automation
  - configuration
sidebar_position: 20
---

import DockerNPM from '@shared/docker-grafana-version.md';

The [`create-plugin` tool](/get-started.md#use-plugin-tools-to-develop-your-plugins-faster) includes a development environment featuring [Docker](https://docs.docker.com/get-docker/). It allows you to start an instance of the Grafana application for plugin developers against which you can code.

:::info

It's not necessary to [sign a plugin](/publish-a-plugin/sign-a-plugin.md) during development. The Docker development environment that is scaffolded with `@grafana/create-plugin` will load the plugin without a signature. This is because it is configured by default to run in [development mode](https://github.com/grafana/grafana/blob/main/contribute/developer-guide.md#configure-grafana-for-development).

:::

## Why use the Docker environment

Docker simplifies the process of creating, deploying, and running applications. It lets you create consistent and isolated environments for your plugin. This makes it easy to manage dependencies and ensures that your plugin runs the same way across different machines.

The `create-plugin` tool configures the Docker container with the necessary variables to allow easy access to Grafana and load plugins without signing them. The plugin tool also adds a live reload feature that triggers browser refreshes when you make frontend code changes, and automatically reloads the plugin binary when you change backend code.

The Docker environment also lets you attach a debugger to the plugin backend code, making the development process easier.

## Get started with Docker

To start your plugin development project, run the following commands in the order listed:

1. **Install dependencies**: <SyncCommand cmd="install" /> installs frontend dependencies.
1. **Build frontend**: <SyncCommand cmd="run dev" /> builds and watches the plugin frontend code.
1. **Build backend**: `mage -v build:linux` builds the plugin backend code. Rerun this command every time you edit your backend files.
1. **Start server**: <SyncCommand cmd="run server" /> starts a Grafana development server running on [http://localhost:3000](http://localhost:3000).

## Configure the Grafana version

To test a plugin across different versions of Grafana, set an environment variable. Use `GRAFANA_VERSION` to set the Grafana version:

<DockerNPM />

## Configure the Grafana image

The default Docker image in the plugin tool is `grafana-enterprise`. To override this image, alter the `docker-compose.yaml` by changing the `grafana_image` build argument:

```yaml title="docker-compose.yaml"
version: '3.7'

services:
  grafana:
    extends:
      file: .config/docker-compose-base.yaml
      service: grafana
    build:
      args:
        grafana_version: ${GRAFANA_VERSION:-9.1.2}
        grafana_image: ${GRAFANA_IMAGE:-grafana}
```

This example assigns the environment variable `GRAFANA_IMAGE` to the build arg `grafana_image` with a default value of `grafana`. This gives you the option to set the value when running `docker compose` commands.

## Debugging a plugin's backend

If you're developing a plugin with a backend part, run `npm run server` with `DEVELOPMENT=true`. The Docker Compose file exposes port `2345` for debugging, from a headless delve instance that runs inside the Docker environment.

You can attach a debugger client to this port to debug your backend code. For example, in VS Code, add a `launch.json` configuration:

```json title="launch.json"
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Attach to plugin backend in docker",
      "type": "go",
      "request": "attach",
      "mode": "remote",
      "port": 2345,
      "host": "127.0.0.1",
      "showLog": true,
      "trace": "log",
      "logOutput": "rpc",
      "substitutePath": [
        {
          "from": "${workspaceFolder}",
          "to": "/root/<YOUR_PLUGIN_ID>"
        }
      ]
    }
  ]
}
```

