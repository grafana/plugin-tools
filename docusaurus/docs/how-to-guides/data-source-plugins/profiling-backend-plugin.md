---
id: profile-backend-plugin
title: Profile a backend plugin
description: How to profile a backend plugin.
keywords:
  - grafana
  - plugins
  - plugin
  - profile
  - profiling
  - continuos profiling
  - backend
  - back-end
---

You can configure a backend plugin to enable certain diagnostics when it starts, so-called profiling data. This can be useful
when investigating certain performance problems, such as high CPU or memory usage, or when usage of [continous profiling](https://grafana.com/oss/pyroscope/) is desired.

## Configure profiling

In the [Grafana configuration file](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/) you can configure profiling under a `[plugin.<plugin ID>]` section where `<plugin ID>` is the plugin identifier of your backend plugin you want to profile, e.g. [grafana-github-datasource](https://grafana.com/grafana/plugins/grafana-github-datasource/).

**Example:**

```ini title="custom.ini"
[plugin.<plugin ID>]
profiling_enabled = true
profiling_port = 6060
profiling_block_rate = 5
profiling_mutex_rate = 5
```

Restart Grafana after applying the configuration changes. You should see a log message similar to below telling you whether profiling was enabled:

```shell
INFO [07-09|19:15:00] Profiling enabled   logger=plugin.<plugin ID> blockProfileRate=1 mutexProfileRate=1
```

Check what debugging endpoints are available by browsing `http://<host>:<profiling_port>/debug/pprof`.

There are some additional [godeltaprof](https://github.com/grafana/pyroscope-go/tree/main/godeltaprof) endpoints available which are more suitable in a continuous profiling scenario. These endpoints are `/debug/pprof/delta_heap`, `/debug/pprof/delta_block`, `/debug/pprof/delta_mutex`.

:::note

To be able to use `profiling_block_rate` and `profiling_mutex_rate` your plugin needs to use at least [`grafana-plugin-sdk-go v0.238.0`](https://github.com/grafana/grafana-plugin-sdk-go/releases/tag/v0.238.0). Refer to [Update the Go SDK](../../create-a-plugin/develop-a-plugin/work-with-backend) for update instructions.

:::

### profiling_enabled

Enable/disable profiling. Default `false`.

### profiling_port

Optionally customize the HTTP port where profile data is exposed, if for example profiling multiple plugins or the default port is taken. Default `6060`.

### profiling_block_rate

:::note

The higher the fraction (that is, the smaller this value) the more overhead it adds to normal operations.

:::

Controls the fraction of goroutine blocking events that are reported in the blocking profile, default `0` (i.e. track no events). Using `5` would report 20% of all events as an example. See https://pkg.go.dev/runtime#SetBlockProfileRate for more detailed information.

:::note

The higher the fraction (that is, the smaller this value) the more overhead it adds to normal operations.

:::

### profiling_mutex_rate

Controls the fraction of mutex contention events that are reported in the mutex profile, default `0` (i.e. track no events). Using `5` would report 20% of all events as an example. See https://pkg.go.dev/runtime#SetMutexProfileFraction for more detailed information.

:::note

The higher the fraction (that is, the smaller this value) the more overhead it adds to normal operations.

:::

## Collect and analyze profiles

In general, you use the [Go command pprof](https://golang.org/cmd/pprof/) to both collect and analyze profiling data. You can also use [curl](https://curl.se/) or similar to collect profiles which could be convenient in environments where you don't have the Go/pprof command available. Next, some usage examples of using curl and pprof to collect and analyze memory and CPU profiles.

### Analyzing high memory usage/memory leaks

When experiencing high memory usage or potential memory leaks it's useful to collect several heap profiles and later when analyzing, compare them. It's a good idea to wait some time, e.g. 30 seconds, between collecting each profile to allow memory consumption to increase.

```bash
curl http://<profile-addr>:<profile-port>/debug/pprof/heap > heap1.pprof
sleep 30
curl http://<profile-addr>:<profile-port>/debug/pprof/heap > heap2.pprof
```

You can then use pprof tool to compare two heap profiles:

```bash
go tool pprof -http=localhost:8081 --base heap1.pprof heap2.pprof
```

### Analyzing high CPU usage

When experiencing high CPU usage it's suggested to collect CPU profiles over a period of time, e.g. 30 seconds.

```bash
curl 'http://<profile-addr>:<profile-port>/debug/pprof/profile?seconds=30' > profile.pprof
```

You can then use pprof tool to analyze the collected CPU profile:

```bash
go tool pprof -http=localhost:8081 profile.pprof
```

## More information

Please refer to the [Grafana profiling documentation](https://grafana.com/docs/grafana/next/setup-grafana/configure-grafana/configure-tracing/#turn-on-profiling-and-collect-profiles) for further information and instructions of how to profile Grafana.
