---
id: add-logs-metrics-traces-for-backend-plugins
title: Add logs, metrics and traces for backend plugins
description: How to add logs, metrics and traces for backend plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - instrument
  - instrumentation
  - logs
  - metrics
  - distributed tracing
  - tracing
  - backend
  - back-end
---

# Add logs, metrics and traces for backend plugins

Adding [logs](#logs), [metrics](#metrics) and [traces](#traces) for backend plugins makes it easier to diagnose and resolve issues for both plugin developers and Grafana operators. This document provides guidance, conventions and best practices to help you effectively instrument your plugins, as well as how to access this data when the plugin is installed.

## Logs

Logs are files that record events, warnings and errors as they occur within a software environment. Most logs include contextual information, such as the time an event occurred and which user or endpoint was associated with it.

### Implement logging in your plugin

Using the global logger, `backend.Logger`, from the [backend package](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend) works everywhere and for most use cases.

**Example:**

The following example shows basic use of the global logger with different severity levels and key-value pairs.

```go
package plugin

import (
    "errors"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
)

func main() {
    backend.Logger.Debug("Debug msg", "someID", 1)
    backend.Logger.Info("Info msg", "queryType", "default")
    backend.Logger.Warning("Warning msg", "someKey", "someValue")
    backend.Logger.Error("Error msg", "error", errors.New("An error occurred"))
}
```

The above example would output something like the following.

```shell
DEBUG[11-14|15:26:26] Debug msg     logger=plugin.grafana-basic-datasource someID=1
INFO [11-14|15:26:26] Info msg      logger=plugin.grafana-basic-datasource queryType=default
WARN [11-14|15:26:26] Warning msg   logger=plugin.grafana-basic-datasource someKey=someValue
ERROR[11-14|15:26:26] Error msg     logger=plugin.grafana-basic-datasource error=An error occurred
```

:::note

The `backend.Logger` is a convenient wrapper over `log.DefaultLogger` from the [log package](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/log) which you also can use to access the global logger.

:::

#### Reuse logger with certain key/value pairs

You can log multiple messages and include certain key-value pairs without repeating your code everywhere, for example when you want to include some specific key-value pairs based on how a datasource has been configured in each log message. To do so, create a new logger with arguments using the `With` method on your instantiated logger.

**Example:**

The following example illustrates how you can instantiate a logger per [datasource instance](../../introduction/plugin-types-usage.md#usage-of-data-source-plugins), and use the `With` method to include certain key-value pairs over the life-time of this datasource instance.

```go
package plugin

import (
    "context"
    "errors"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
)

func NewDatasource(ctx context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
    logger := backend.Logger.With("key", "value")

    return &Datasource{
        logger: logger,
    }, nil
}

func (ds *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
    ds.logger.Debug("QueryData", "queries", len(req.Queries))
}
```

The above example would output something like the following each time `QueryData` is called.

```shell
DEBUG[11-14|15:26:26] QueryData     logger=plugin.grafana-basic-datasource key=value queries=2
```

:::note

You can also use `backend.NewLoggerWith` from the [backend package](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend) which is a helper method that calls `log.New().With(args...)` from the [log package](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/log).

:::

#### Use a contextual logger

Use a contextual logger to automatically include additional key-value pairs attached to `context.Context`. For example, you can use `traceID` to allow correlating logs with traces and correlate logs with a common identifier. You can create a new contextual logger by using the `FromContext` method on your instantiated logger; you can also combine this method when [reusing logger with certain key-value pairs](#reuse-logger-with-certain-keyvalue-pairs). We recommend using a contextual logger whenever you have access to a `context.Context`.

:::note

Make sure you are using at least [grafana-plugin-sdk-go v0.186.0](https://github.com/grafana/grafana-plugin-sdk-go/releases/tag/v0.186.0). See [Update the Go SDK](../develop-a-plugin/work-with-backend#update-the-go-sdk) for update instructions.

:::

By default, the following key-value pairs are included in logs when using a contextual logger:

- **pluginID:** The plugin identifier. For example, `grafana-github-datasource`.
- **endpoint:** The request being handled; that is, `callResource`, `checkHealth`, `collectMetrics`, `queryData`, `runStream`, `subscribeStream`, or `publishStream`.
- **traceID:** If available, includes the distributed trace identifier.
- **dsName:** If available, the name of the configured datasource instance.
- **dsUID:** If available, the unique identifier (UID) of the configured datasource instance.
- **uname:** If available, the username of the user who made the request.

**Example:**

The following example extends the [Reuse logger with certain key/value pairs](#reuse-logger-with-certain-keyvalue-pairs) example to include usage of a contextual logger.

```go
package plugin

import (
    "context"
    "errors"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
)

func NewDatasource(ctx context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
    logger := backend.Logger.With("key", "value")

    return &Datasource{
        logger:   logger,
    }, nil
}

func (ds *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
    ctxLogger := ds.logger.FromContext(ctx)
    ctxLogger.Debug("QueryData", "queries", len(req.Queries))
}
```

The above example would output something like this each time `QueryData` is called with 2 queries.

```shell
DEBUG[11-14|15:26:26] QueryData     logger=plugin.grafana-basic-datasource pluginID=grafana-basic-datasource endpoint=queryData traceID=399c275ebb516a53ec158b4d0ddaf914 dsName=Basic datasource dsUID=kXhzRl7Mk uname=admin key=value queries=2
```

#### Include additional contextual information in logs

If you want to propagate additional contextual key-value pairs to subsequent code/logic you can use the [log.WithContextualAttributes](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/log#WithContextualAttributes) function.

**Example:**

The following example extends the [Use a contextual logger](#use-a-contextual-logger) example with usage of the `log.WithContextualAttributes` function by adding additional contextual key-value pairs and allow propagation of these to other methods (`handleQuery`).

```go
package plugin

import (
    "context"
    "errors"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
    "github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

func NewDatasource(ctx context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
    logger := backend.Logger.With("key", "value")

    return &Datasource{
        logger: logger,
    }, nil
}

func (ds *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
    ctxLogger := ds.logger.FromContext(ctx)
    ctxLogger.Debug("QueryData", "queries", len(req.Queries))

    for _, q := range req.Queries {
        childCtx = log.WithContextualAttributes(ctx, []any{"refID", q.RefID, "queryType", q.QueryType})
        ds.handleQuery(childCtx, q)
    }
}

func (ds *Datasource) handleQuery(ctx context.Context, q backend.DataQuery) {
    ctxLogger := ds.logger.FromContext(ctx)
    ctxLogger.Debug("handleQuery")
}
```

The above example would output something like this each time `QueryData` is called with 2 queries.

```shell
DEBUG[11-14|15:26:26] QueryData     logger=plugin.grafana-basic-datasource pluginID=grafana-basic-datasource endpoint=queryData traceID=399c275ebb516a53ec158b4d0ddaf914 dsName=Basic datasource dsUID=kXhzRl7Mk uname=admin queries=2
DEBUG[11-14|15:26:26] handleQuery   logger=plugin.grafana-basic-datasource pluginID=grafana-basic-datasource endpoint=queryData traceID=399c275ebb516a53ec158b4d0ddaf914 dsName=Basic datasource dsUID=kXhzRl7Mk uname=admin refID=A queryType=simpleQuery
DEBUG[11-14|15:26:26] handleQuery   logger=plugin.grafana-basic-datasource pluginID=grafana-basic-datasource endpoint=queryData traceID=399c275ebb516a53ec158b4d0ddaf914 dsName=Basic datasource dsUID=kXhzRl7Mk uname=admin refID=B queryType=advancedQuery
```

### Best practices

- Start the log message with a capital letter; for example, `logger.Info("Hello world")` instead of `logger.Info("hello world")`.
- The log message should be an identifier for the log entry, try to avoid parameterization; for example, `logger.Debug(fmt.Sprintf(“Something happened, got argument %d”, “arg”))`, in favor of key-value pairs for additional data; for example, `logger.Info(“Something happened”, “argument”, “arg”)`.
- Prefer using camelCase style when naming log keys; for example, `remoteAddr` or `userID`, to be consistent with Go identifiers.
- Use the key `error` when logging Go errors; for example, `logger.Error("Something failed", "error", errors.New("An error occurred")`.
- Use a contextual logger whenever you have access to a `context.Context`.
- Do not log sensitive information, such as data source credentials or IP addresses, or other personally identifiable information.

#### Validate and sanitize input coming from user input

If log messages or key-value pairs originate from user input they should be validated and sanitized. Be careful to not expose any sensitive information in log messages (secrets, credentials, and so on). It's especially easy to do by mistake when including a Go struct as a value.

If values originating from user input are bounded, that is when there are a fixed set of expected values, it's recommended to validate it's one of these values or else return an error.

If values originating from user input are unbounded, that is when the value could be anything, it's recommended to validate the max length/size of value and return an error or sanitize by just allowing a certain amount/fixed set of characters.

#### When to use which log level?

- **Debug:** Informational messages of high frequency and less-important messages during normal operations.
- **Info:** Informational messages of low frequency and important messages.
- **Warning:** An error/state that can be be recovered from without interrupting the operation. If used, it should be actionable so that the operator can do something to resolve it.
- **Error:** Error messages indicating some operation failed (with an error) and the program didn't have a way to handle the error.

:::note

Incoming requests of high frequency are normally more common for the `QueryData` endpoint, since - for example - the nature of a dashboard generates a request per panel or query.

:::

### Inspect logs locally

Logs from a backend plugin are consumed by the connected Grafana instance and included in the Grafana server log.

Each log message for a backend plugin will include a logger name, `logger=plugin.<plugin id>`. Example:

```shell
DEBUG[11-14|15:26:26] Debug msg     logger=plugin.grafana-basic-datasource someID=1
INFO [11-14|15:26:26] Info msg      logger=plugin.grafana-basic-datasource queryType=default
WARN [11-14|15:26:26] Warning msg   logger=plugin.grafana-basic-datasource someKey=someValue
ERROR[11-14|15:26:26] Error msg     logger=plugin.grafana-basic-datasource error=An error occurred
```

You can enable [debug logging in your Grafana instance](https://grafana.com/docs/grafana/latest/troubleshooting/#troubleshoot-with-logs) and that will normally output a huge amount of information and make it hard to find the logs related to a certain plugin. However, using a named logger makes it convenient to enable debug logging only for a certain named logger and plugin:

```
[log]
filters = plugin.<plugin id>:debug
```

Please refer to [Configure Grafana](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#log) for more details about setting up logging.

Further, see [How to collect and visualize logs, metrics and traces](#collect-and-visualize-logs-metrics-and-traces).

## Metrics

Metrics are quantifiable measurements that reflect the health and performance of applications or infrastructure.

Consider using metrics to provide real-time insight into the state of resources. If you want to know how responsive your plugin is or identify anomalies that could be early signs of a performance issue, metrics are a key source of visibility.

### Metric types

There are four different metric types supported in Prometheus and that you can use:

- **Counter:** Can only increase or be reset to zero on restart. For example, you can use a counter to represent the number of requests served, tasks completed, or errors.
- **Gauge:** Numerical value that can arbitrarily go up and down. For example, you can use a gauge to represent the temperatures or current memory usage.
- **Histogram:** Samples observations (usually things like request durations or response sizes) and counts them in configurable buckets. It also provides a sum of all observed values.
- **Summary:** Similar to a histogram, a summary samples observations (usually things like request durations and response sizes). While it also provides a total count of observations and a sum of all observed values, it calculates configurable quantiles over a sliding time window.

See [Prometheus metric types](https://prometheus.io/docs/concepts/metric_types/) for a list and detailed description of the different metric types you can use and when to use them.

### Automatic instrumentation by the SDK

The SDK provides automatic collection and exposure of Go runtime, CPU, memory and process metrics to ease developer and operator experience. These metrics are exposed under the `go_` and `process_` namespaces and includes to name a few:

- `go_info`: Information about the Go environment.
- `go_memstats_alloc_bytes`: Number of bytes allocated and still in use.
- `go_goroutines`: Number of goroutines that currently exist.
- `process_cpu_seconds_total`: Total user and system CPU time spent in seconds.

For further details and an up-to-date list of what metrics are automatically gathered and exposed for your plugin it's suggested to call Grafana's HTTP API, `/api/plugins/:pluginID/metrics`. See also [Collect and visualize metrics locally](#collect-and-visualize-metrics-locally) for further instructions how to pull metrics into Promethus.

### Implement metrics in your plugin

The [Grafana plugin SDK for Go](../../introduction/grafana-plugin-sdk-for-go.md) uses the [Prometheus instrumentation library for Go applications](https://github.com/prometheus/client_golang). Any custom metric registered with the [default registry](https://pkg.go.dev/github.com/prometheus/client_golang/prometheus#pkg-variables) will be picked up by the SDK and exposed through the [Collect metrics capability](../../introduction/backend.md#collect-metrics).

For convenience, it's recommended to use the [promauto package](https://pkg.go.dev/github.com/prometheus/client_golang/prometheus/promauto) when creating custom metrics since it automatically registers the metric in the [default registry](https://pkg.go.dev/github.com/prometheus/client_golang/prometheus#pkg-variables) and exposes them to Grafana.

**Example:**

The following example shows how to define and use a custom counter metric named `grafana_plugin_queries_total` that tracks the total number of queries per query type.

```go
package plugin

import (
    "context"

    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
)

var queriesTotal = promauto.NewCounterVec(
    prometheus.CounterOpts{
        Namespace: "grafana_plugin",
        Name:      "queries_total",
        Help:      "Total number of queries.",
    },
    []string{"query_type"},
)

func (ds *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
    for _, q := range req.Queries {
        queriesTotal.WithLabelValues(q.QueryType).Inc()
    }
}
```

### Best practices

- Consider using the namespace `grafana_plugin` as that would prefix any defined metric names with `plugin`. This will make it clear for operators that any metric named `grafana_plugin` originates from a Grafana plugin.
- Use snake case style when naming metrics, e.g. `http_request_duration_seconds` instead of `httpRequestDurationSeconds`.
- Use snake case style when naming metric labels, e.g. `status_code` instead of `statusCode`.
- If the metric type is a counter, name it with a `_total` suffix, e.g. `http_requests_total`.
- If the metric type is a histogram and you're measuring duration, name it with a `_<unit>` suffix, e.g. `http_request_duration_seconds`.
- If the metric type is a gauge, name it to denote it's a value that can increase and decrease , e.g. `http_request_in_flight`.

#### Validate and sanitize input coming from user input

If label values originate from user input they should be validated and cleaned. It is very important to only allow a predefined set of labels to minimize the risk of high cardinality problems. Using or allowing too many label values could result in high cardinality problems. For example, using user IDs, email addresses, or other unbounded sets of values as a label could pretty easily create high cardinality problems and leading to a huge amount of time series in Prometheus. For more information about labels and high cardinality, see [Prometheus label naming](https://prometheus.io/docs/practices/naming/#labels).

Be careful to not expose any sensitive information in label values (secrets, credentials, and so on).

If a value originating from user input are bounded, that is when there are a fixed set of expected values, it's recommended to validate it's one of these values or else return an error.

If a value originating from user input are unbounded, that is when the value could be anything, it's in general not recommended to use as a label because of high cardinality problems mentioned earlier. If still needed, the recommendation is to validate the max length/size of value and return an error or sanitize by just allowing a certain amount/fixed set of characters.

### Collect and visualize metrics locally

Please refer to [Pull metrics from Grafana backend plugin into Prometheus](https://grafana.com/docs/grafana/latest/setup-grafana/set-up-grafana-monitoring/#pull-metrics-from-grafana-backend-plugin-into-prometheus).

Further, see [How to collect and visualize logs, metrics and traces](#collect-and-visualize-logs-metrics-and-traces).

## Traces

Distributed tracing allows backend plugin developers to create custom spans in their plugins, and then send them to the same endpoint and with the same propagation format as the main Grafana instance. The tracing context is also propagated from the Grafana instance to the plugin, so the plugin's spans will be correlated to the correct trace.

:::note

This feature requires at least Grafana 9.5.0, and your plugin needs to be built at least with `grafana-plugins-sdk-go v0.157.0`. If you run a plugin with tracing features on an older version of Grafana, tracing will be disabled.

:::

### Plugin configuration

Plugin tracing must be enabled manually on a per-plugin basis. To do so, specify`tracing = true` in the plugin's config section:

```
[plugin.myorg-myplugin-datasource]
tracing = true
```

### OpenTelemetry configuration in Grafana

Grafana supports [OpenTelemetry](https://opentelemetry.io/) for distributed tracing. If Grafana is configured to use a deprecated tracing system (Jaeger or OpenTracing), then tracing is disabled in the plugin provided by the SDK and configured when calling `datasource.Manage | app.Manage`.

OpenTelemetry must be enabled and configured for the Grafana instance. Refer to [Configure Grafana](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana#tracingopentelemetry) for more information.

Refer to the [OpenTelemetry Go SDK](https://pkg.go.dev/go.opentelemetry.io/otel) for in-depth documentation about all the features provided by OpenTelemetry.

:::note

If tracing is disabled in Grafana, `backend.DefaultTracer()` returns a no-op tracer.

:::

### Implement tracing in your plugin

:::note

Make sure you are using at least [`grafana-plugin-sdk-go v0.157.0`](https://github.com/grafana/grafana-plugin-sdk-go/releases/tag/v0.157.0). Refer to [Update the Go SDK](../develop-a-plugin/work-with-backend#update-the-go-sdk) for update instructions.

:::

#### Configure a global tracer

When OpenTelemetry tracing is enabled on the main Grafana instance and tracing is enabled for a plugin, the OpenTelemetry endpoint address and propagation format is passed to the plugin during startup. These parameters are used to configure a global tracer.

1. Use `datasource.Manage` or `app.Manage` to run your plugin to automatically configure the global tracer. Specify any custom attributes for the default tracer using `CustomAttributes`:

   ```go
   func main() {
       if err := datasource.Manage("MY_PLUGIN_ID", plugin.NewDatasource, datasource.ManageOpts{
           TracingOpts: tracing.Opts{
               // Optional custom attributes attached to the tracer's resource.
               // The tracer will already have some SDK and runtime ones pre-populated.
               CustomAttributes: []attribute.KeyValue{
                   attribute.String("my_plugin.my_attribute", "custom value"),
               },
           },
       }); err != nil {
           log.DefaultLogger.Error(err.Error())
           os.Exit(1)
       }
   }
   ```

1. Once you have configured tracing, use the global tracer like this:

   ```go
   tracing.DefaultTracer()
   ```

   This returns an [OpenTelemetry `trace.Tracer`](https://pkg.go.dev/go.opentelemetry.io/otel/trace#Tracer) for creating spans.

   **Example:**

   ```go
   func (d *Datasource) query(ctx context.Context, pCtx backend.PluginContext, query backend.DataQuery) (backend.DataResponse, error) {
       ctx, span := tracing.DefaultTracer().Start(
           ctx,
           "query processing",
           trace.WithAttributes(
               attribute.String("query.ref_id", query.RefID),
               attribute.String("query.type", query.QueryType),
               attribute.Int64("query.max_data_points", query.MaxDataPoints),
               attribute.Int64("query.interval_ms", query.Interval.Milliseconds()),
               attribute.Int64("query.time_range.from", query.TimeRange.From.Unix()),
               attribute.Int64("query.time_range.to", query.TimeRange.To.Unix()),
           ),
       )
       defer span.End()

       // ...
   }
   ```

### Automatic instrumentation by the SDK

The SDK automates some instrumentation to ease developer experience. This section explores the default tracing added to gRPC calls and outgoing HTTP requests.

#### Tracing gRPC calls

When tracing is enabled, a new span is created automatically for each gRPC call (`QueryData`, `CallResource`, `CheckHealth`, and so on), both on Grafana's side and on the plugin's side. The plugin SDK also injects the trace context into the `context.Context` that is passed to those methods.

You can retrieve the [trace.SpanContext](https://pkg.go.dev/go.opentelemetry.io/otel/trace#SpanContext) with `tracing.SpanContextFromContext` by passing the original `context.Context` to it:

```go
func (d *Datasource) query(ctx context.Context, pCtx backend.PluginContext, query backend.DataQuery) (backend.DataResponse, error) {
    spanCtx := trace.SpanContextFromContext(ctx)
    traceID := spanCtx.TraceID()

    // ...
}
```

#### Tracing outgoing HTTP requests

When tracing is enabled, a `TracingMiddleware` is also added to the default middleware stack to all HTTP clients created using the [`httpclient.New`](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/httpclient#New) or [`httpclient.NewProvider`](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/httpclient#NewProvider), unless you specify custom middleware. This middleware creates spans for each outgoing HTTP request and provides some useful attributes and events related to the request's lifecycle.

### Collect and visualize traces locally

Refer to [How to collect and visualize logs, metrics and traces](#collect-and-visualize-logs-metrics-and-traces).

### Plugin example

Refer to the [datasource-http-backend plugin example](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/datasource-http-backend) for a complete example of a plugin with full distributed tracing support.

## Collect and visualize logs, metrics and traces

If you want to collect and visualize logs, metrics and traces using Loki, Prometheus, and Tempo when developing your plugin, refer to https://github.com/grafana/grafana/tree/main/devenv/docker/blocks/self-instrumentation which are being used by the Grafana maintainers.
