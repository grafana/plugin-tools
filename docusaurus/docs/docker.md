---
id: docker
title: Docker Development Environment
---

`@grafana/create-plugin` includes a development environment that uses Docker to start an instance of the Grafana application for plugin developers to code against.

:::info
[Docker](https://docs.docker.com/get-docker/) simplifies the process of creating, deploying, and running applications. It is useful for development as it allows the creation of consistent and isolated environments for applications. This makes it easy to manage dependencies and ensure that the application runs the same way across different machines.
:::

The Docker container is configured with the necessary variables to allow easy access to grafana and to load plugins without the need for them to be signed. It also adds a live reload feature allowing frontend changes to trigger browser refreshes whenever the frontend code changes.

To get started run the following commands in the order listed:

- `yarn install`: Install frontend dependencies.
- `yarn dev`: Build and watch the plugin frontend code.
- `mage -v build:linux`: Build the plugin backend code. This command must be rerun every time you edit your backend files.
- `yarn server`: Start a grafana development server running on [http://localhost:3000](http://localhost:3000). Restart this command each time you run `mage` to run your new backend code.


### Configure the Grafana version

You can use the environment variable `GRAFANA_VERSION` to set the Grafana version whilst developing the plugin. This is useful for testing a plugin across different versions of Grafana.

```shell
GRAFANA_VERSION=8.5.5 yarn server
```

### Configure the Grafana image

`grafana-enterprise` is the default Docker image. To override this image alter the `docker-compose.yaml` adding the following build arg `grafana_image`.

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
