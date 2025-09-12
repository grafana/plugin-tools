---
id: debugging-plugins
title: Debugging Plugins with React
description: How to debug your React-based Grafana Plugin.
keywords:
  - grafana
  - plugins
  - plugin
  - debugging
---

# How to set up Grafana for React Tools profiling and debugging

Using the React Tools debugger in the browser is very useful when either creating a new plugin or troubleshooting an issue with an existing plugin.

## Setup for debugging

By default Grafana docker images do not include a debug build for React.

By using a debug build of grafana you are able to easily step through code that has not been "uglified" and also use the "Profiler" in React Dev Tools.

To use a debug build, update your `docker-compose.yml` with the corresponding version found on hub.docker.com.

If your plugin supports an older (supported) release, locate the tag using search option (this matches v11.5).

### Grafana OSS

For 11.5+ OSS
[v11.5+ OSS](https://hub.docker.com/repository/docker/grafana/grafana-oss-dev/tags?name=11.5)

For 12.1+ OSS
[v12.1+ OSS](https://hub.docker.com/repository/docker/grafana/grafana-oss-dev/tags?name=12.1)

```YAML
services:
  grafana:
    image: grafana/grafana-oss-dev:12.1.0-255911
    ...
```

Alternatively you can use an environment variable and not modify the existing docker-compose.yml file:

```SHELL
export GRAFANA_IMAGE=grafana-oss-dev
export GRAFANA_VERSION=12.1.0-255911
```

### Grafana Enterprise

Enterprise supports additional API calls, use this type of image when your plugin relies on Enterprise features.

For v11.5+ Enterprise
[v11.5+ Enterprise](https://hub.docker.com/repository/docker/grafana/grafana-enterprise-dev/tags?name=11.5)

For 12.1+ Enterprise
[v12.1+ Enterprise](https://hub.docker.com/repository/docker/grafana/grafana-enterprise-dev/tags?name=12.1)

```YAML
services:
  grafana:
    image: grafana/grafana-enterprise-dev:12.1.0-92854
    ...
```

Alternatively you can use an environment variable and not modify the existing docker-compose.yml file:

```SHELL
export GRAFANA_IMAGE=grafana-enterprise-dev
export GRAFANA_VERSION=12.1.0-92854
```

## Using React Tools

Once your docker environment has started up, using Chrome, navigate to the instance and select

`View->Developer->Developer Tools`

You can now use the "Profiler" tab in the debugging tools, which provides Flamegraph, Ranked, and Timeline options.

This process will also work with Firefox with the React Developer Tools extension installed, and can be found by selecting within the browser:

`Tools->Browser Tools->Web Developer Tools`
