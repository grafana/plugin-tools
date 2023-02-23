---
id: docker
title: Docker Development Environment
---

`@grafana/create-plugin` creates a development environment that uses docker to start an instance of the Grafana application for plugin developers to code against.

:::info
[Docker](https://docs.docker.com/get-docker/) simplifies the process of creating, deploying, and running applications. It is useful for development as it allows the creation of consistent and isolated environments for applications. This makes it easy to manage dependencies and ensure that the application runs the same way across different machines.
:::

To get started run the following commands in order:

- `yarn install` install frontend dependencies.
- `yarn dev` build and watch the plugin frontend code.
- `mage -v build:linux` build the plugin backend code. This command must be rerun every time you edit your backend files.
- `yarn server` start a grafana development server running on [http://localhost:3000](http://localhost:3000). Restart this command each time you run `mage` to run your new backend code.

### Configure the Grafana image

`grafana-enterprise` is the default docker image for all docker related commands. To override this image alter the `docker-compose.yaml` adding the following build arg `grafana_image`.

**Example:**

```yaml
version: '3.7'

services:
  grafana:
    container_name: 'myorg-basic-app'
    build:
      context: ./.config
      args:
        grafana_version: ${GRAFANA_VERSION:-9.1.2}
        grafana_image: ${GRAFANA_IMAGE:-grafana}
```

This example assigns the environment variable `GRAFANA_IMAGE` to the build arg `grafana_image` with a default value of `grafana`. This gives you the possibility to set the value when running `docker-compose` commands.
