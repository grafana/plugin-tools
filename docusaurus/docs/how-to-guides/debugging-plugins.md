---
id: debugging-plugins
title: Debug plugins with React tools
description: How to debug your React-based Grafana Plugin.
keywords:
  - grafana
  - plugins
  - plugin
  - debugging
---

# Debug your plugins with React Tools

Use the [React Tools debugger](https://react.dev/learn/react-developer-tools) to develop new Grafana plugins and troubleshooting existing ones. 

## Set up Grafana for profiling and debugging

Using a debug build of Grafana allows you to easily step through code that has not been minimized and use the `Profiler` in the React Developer Tools. 

By default, Grafana Docker images do not contain a React debug build. To use a debug build, update your `docker-compose.yml` with the corresponding version found on [hub.docker.com](https://hub.docker.com/). If your plugin supports an older (supported) release, locate the tag using search option.

### Set up your Grafana OSS Docker build

* For Grafana OSS versions 11.5 or above, refer to [v11.5+ OSS](https://hub.docker.com/repository/docker/grafana/grafana-oss-dev/tags?name=11.5).

* For Grafana OSS versions 12.1 or above, refer to [v12.1+ OSS](https://hub.docker.com/repository/docker/grafana/grafana-oss-dev/tags?name=12.1).

For example:

```YAML
services:
  grafana:
    image: grafana/grafana-oss-dev:12.1.0-255911
    ...
```

Alternatively, you can use an environment variable and not modify the existing `docker-compose.yml` file:

```SHELL
export GRAFANA_IMAGE=grafana-oss-dev
export GRAFANA_VERSION=12.1.0-255911
```

### Set up your Grafana Enterprise Docker build

Since Grafana Enterprise supports additional API calls, use this type of image when your plugin relies on Enterprise features.

* For Grafana Enterprise versions 11.5 or above, refer to [v11.5+ Enterprise](https://hub.docker.com/repository/docker/grafana/grafana-enterprise-dev/tags?name=11.5).

* For Grafana Enterprise versions 12.1 or above, refer to [v12.1+ Enterprise](https://hub.docker.com/repository/docker/grafana/grafana-enterprise-dev/tags?name=12.1).

For example:

```YAML
services:
  grafana:
    image: grafana/grafana-enterprise-dev:12.1.0-92854
    ...
```

Alternatively, you can use an environment variable without modifying the existing `docker-compose.yml` file:

```SHELL
export GRAFANA_IMAGE=grafana-enterprise-dev
export GRAFANA_VERSION=12.1.0-92854
```

## Use React Tools

To use React development tools to debug Grafana, follow these steps:

1. Start your Docker environment.
1. Open Chrome or Firefox and navigate to your Grafana instance.
  - In Chrome, select **View > Developer > Developer Tools**.
  - In Firefox, select **Tools > Browser Tools > Web Developer Tools**. Note that Firefox needs to have the React Developer Tools extension installed.

You can now use the **Profiler** tab in the debugging tools, which provides Flamegraph, Ranked, and Timeline options.



