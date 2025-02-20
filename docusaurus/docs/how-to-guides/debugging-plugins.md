---
id: debugging-plugins
title: Add anonymous usage reporting
description: How to add anonymous usage tracking to your Grafana plugin.
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

If your plugin supports and older (supported) release, locate the tag using search option (this matches v10.2).

### Grafana OSS

For v10.2+ OSS
[v10.2+ OSS](https://hub.docker.com/repository/docker/grafana/grafana-oss-dev/tags?name=10.2)

For 11.5+ OSS
[v11.5+ OSS](https://hub.docker.com/repository/docker/grafana/grafana-oss-dev/tags?name=11.5)

```YAML
services:
  grafana:
    image: grafana/grafana-oss-dev:11.5.0-221762
    ...
```

Alternatively you can use an environment variable and not modify the existing docker-compose.yml file:

```SHELL
export GRAFANA_IMAGE=grafana-oss-dev
export GRAFANA_VERSION=11.5.0-221762
```

### Grafana Enterprise

Enterprise supports additional API calls, use this type of image when your plugin relies on Enterprise features.

For v10.2+ Enterprise
[v10.2+ Enterprise](https://hub.docker.com/repository/docker/grafana/grafana-enterprise-dev/tags?name=10.2)

For 11.5+ Enterprise
[v11.5+ Enterprise](https://hub.docker.com/repository/docker/grafana/grafana-enterprise-dev/tags?name=11.5)

```YAML
services:
  grafana:
    image: grafana/grafana-enterprise-dev:11.5.0-82747
    ...
```

Alternatively you can use an environment variable and not modify the existing docker-compose.yml file:

```SHELL
export GRAFANA_IMAGE=grafana-enterprise-dev
export GRAFANA_VERSION=11.5.0-82747
```

## Using React Tools

Once your docker environment has started up, navigate to the instance and select

`View->Developer->Developer Tools`

You can now use the "Profiler" tab in the debugging tools, which provides Flamegraph, Ranked, and Timeline options.
