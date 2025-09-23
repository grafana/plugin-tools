---
id: profile-backend-plugin
title: Profile a plugin's backend
description: How to profile a plugin's backend.
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

This guide provides instructions for configuring a plugin with a backend to enable certain diagnostics when it starts, generating _profiling data_. Profiling data provides potentially useful information to investigate certain performance problems, such as high CPU or memory usage, or when you want to use [continuous profiling](https://grafana.com/oss/pyroscope/).

## Configure profiling data

The [Grafana configuration file](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/) allows you to configure profiling under the `[plugin.<plugin ID>]`.

In this section of the file, specify: 

- The `<plugin ID>`, a unique identifier, for the plugin you want to profile. For example, [grafana-github-datasource](https://grafana.com/grafana/plugins/grafana-github-datasource/). 
- The profiling configuration options, as detailed in sub-sections below.

**Example configuration:**

```ini title="custom.ini"
[plugin.<plugin ID>]
profiling_enabled = true
profiling_port = 6060
profiling_block_rate = 5
profiling_mutex_rate = 5
```

Restart Grafana after applying the configuration changes. You should see a log message that indicates whether profiling was enabled. For example:

```shell
INFO [07-09|19:15:00] Profiling enabled   logger=plugin.<plugin ID> blockProfileRate=5 mutexProfileRate=5
```

:::note

To be able to use `profiling_block_rate` and `profiling_mutex_rate`, your plugin needs to use at least [`grafana-plugin-sdk-go v0.238.0`](https://github.com/grafana/grafana-plugin-sdk-go/releases/tag/v0.238.0). Refer to [Update the Go SDK](../../key-concepts/backend-plugins/grafana-plugin-sdk-for-go.md#update-the-go-sdk) for instructions on how to update the SDK.

:::

### The profiling_enabled option

Use this to enable/disable profiling. The default is `false`.

### The profiling_port option

Optionally, customize the HTTP port where profile data is exposed. For example, use if you want to profile multiple plugins or if the default port is taken. The default is `6060`.

### The profiling_block_rate option

Use this to control the fraction of `goroutine` blocking events that are reported in the blocking profile. The default is `0` (that is, track no events). For example, use `5` to report 20 percent of all events. Refer to https://pkg.go.dev/runtime#SetBlockProfileRate for more detailed information.

:::note

The higher the fraction (that is, the smaller this value) the more overhead it adds to normal operations.

:::

### The profiling_mutex_rate option

Use this to control the fraction of mutex contention events that are reported in the mutex profile. The default is `0` (that is, track no events). For example, use `5` to report 20 percent of all events. Refer to https://pkg.go.dev/runtime#SetMutexProfileFraction for more detailed information.

:::note

The higher the fraction (that is, the smaller this value) the more overhead it adds to normal operations.

:::

## A note about overhead

Running a plugin with profiling enabled and without [block](#the-profiling_block_rate-option) and [mutex](#the-profiling_block_rate-option) profiles enabled should only add a fraction of overhead. These endpoints are therefore suitable for production or continuous profiling scenarios.

Adding a small fraction of block and mutex profiles, such as 5 or 10 (that is, 10 to 20 percent) should in general be fine, but your experience might vary depending on the plugin.

On the other hand, there are potential issues. For example, if you experience requests being slow or queued and you're out of clues, then you could temporarily configure profiling to collect 100 percent of block and mutex profiles to get the full picture. When this is done, turn it off after the profiles have been collected.

## Check for debugging endpoints

Check which debugging endpoints are available by browsing `http://localhost:<profiling_port>/debug/pprof`.

In this file, `localhost` is used, implying that you're connected to the host where Grafana and the plugin are running. If connecting from another host, adjust as needed.

### Additional endpoints

There are some additional [godeltaprof](https://github.com/grafana/pyroscope-go/tree/main/godeltaprof) endpoints available for profiling. These endpoints are more suitable in a continuous profiling scenario.

These endpoints are:

- `/debug/pprof/delta_heap`
- `/debug/pprof/delta_block`
- `/debug/pprof/delta_mutex`

## Collect and analyze profiles

In general, you use the [Go command `pprof`](https://golang.org/cmd/pprof/) to both collect and analyze profiling data. You can also use [`curl`](https://curl.se/) or similar tools to collect profiles which could be convenient in environments where you don't have the Go `pprof` command available.

Next, let's look at some examples of using `curl` and `pprof` to collect and analyze memory and CPU profiles.

### Analyze high memory usage and memory leaks

When experiencing high memory usage or potential memory leaks it's useful to collect several heap profiles. And then later you can analyze and compare them.

It's a good idea to wait some time, for example, 30 seconds, between collecting each profile to allow memory consumption to increase.

In the following example, `localhost` is used to imply that you're connected to the host where Grafana and the plugin are running. If you're connecting from another host, then adjust the command as needed.

```bash
curl http://localhost:<profiling_port>/debug/pprof/heap > heap1.pprof
sleep 30
curl http://localhost:<profiling_port>/debug/pprof/heap > heap2.pprof
```

You can then use the `pprof` tool to compare two heap profiles. For example:

```bash
go tool pprof -http=localhost:8081 --base heap1.pprof heap2.pprof
```

### Analyze high CPU usage

When you experience high CPU usage, it's a good idea to collect CPU profiles over a period of time, for example, 30 seconds.

In the following example, `localhost` is used to imply that you're connected to the host where Grafana and the plugin are running. If you're connecting from another host, then adjust the command as needed.

```bash
curl 'http://localhost:<profiling_port>/debug/pprof/profile?seconds=30' > profile.pprof
```

You can then use the `pprof` tool to compare two heap profiles. For example:

```bash
go tool pprof -http=localhost:8081 profile.pprof
```

## More information

Refer to the [Grafana profiling documentation](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/configure-tracing/#turn-on-profiling-and-collect-profiles) for further information and instructions of how to profile Grafana.
