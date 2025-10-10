---
id: add-router
title: Add a router or multiplexer to query different data types
sidebar_label: Query different data with a router or multiplexer
description: Add a router or multiplexer to your plugin backend to query different data types.
keywords:
  - grafana
  - plugins
  - plugin
  - router
  - multiplexer
---

# Add a router or multiplexer to query different data types

The `QueryData` method in your plugin's backend allows you to query one type of data only. To support different kinds of queries (metrics, logs, and traces) you need to implement query router (also known as a _multiplexer_).

To do so: 

1. Populate the `queryType` property of your query model client-side, as shown in the [`DataQuery`](https://github.com/grafana/grafana/blob/a728e9b4ddb6532b9fa2f916df106e792229e3e0/packages/grafana-data/src/types/query.ts#L47) interface.
1. With `queryType` populated in queries and sent to your plugin backend component, use [`datasource.QueryTypeMux`](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/datasource#QueryTypeMux) to multiplex or route different query types to separate query handlers.
1. Each query handler can then `json.Unmarshal` each query JSON field in [`DataQuery`](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend#DataQuery) to a certain Go struct as shown in this example:

```go
package mydatasource

import (
	"context"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
)

type MyDatasource struct {
	queryHandler backend.QueryDataHandler
}

func New() *MyDatasource {
	ds := &MyDatasource{}
	queryTypeMux := datasource.NewQueryTypeMux()
	queryTypeMux.HandleFunc("metrics", ds.handleMetricsQuery)
	queryTypeMux.HandleFunc("logs", ds.handleLogsQuery)
	queryTypeMux.HandleFunc("traces", ds.handleTracesQuery)
	queryTypeMux.HandleFunc("", ds.handleQueryFallback)
	ds.queryHandler := queryTypeMux
	return ds
}

func (d *MyDatasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	return d.queryHandler.QueryData(ctx, req)
}

// handleMetricsQuery handle queries of query type "metrics".
// All queries in backend.QueryDataRequest is guaranteed to only
// include queries with queryType "metrics".
func (d *MyDatasource) handleMetricsQuery(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	// implementation...
}

// handleLogsQuery handle queries of query type "logs".
// All queries in backend.QueryDataRequest is guaranteed to only
// include queries with queryType "logs".
func (d *MyDatasource) handleLogsQuery(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	// implementation...
}

// handleTracesQuery handle queries of query type "logs".
// All queries in backend.QueryDataRequest is guaranteed to only
// include queries with queryType "traces".
func (d *MyDatasource) handleTracesQuery(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	// implementation...
}

// handleQueryFallback handle queries without a matching query type handler registered.
func (d *MyDatasource) handleQueryFallback(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	// implementation...
}
```

## Advanced usage

You can find an example of using [`QueryTypeMux`](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/datasource#QueryTypeMux) in Grafana's built-in TestData data source code:

- [Create a query type multiplexer](https://github.com/grafana/grafana/blob/623ee3a2be5c4cd84c61b6bbe82a32d18cc29828/pkg/tsdb/grafana-testdata-datasource/testdata.go#L22) and [call `registerScenarios`](https://github.com/grafana/grafana/blob/623ee3a2be5c4cd84c61b6bbe82a32d18cc29828/pkg/tsdb/grafana-testdata-datasource/testdata.go#L44).
- The [`registerScenarios` method](https://github.com/grafana/grafana/blob/623ee3a2be5c4cd84c61b6bbe82a32d18cc29828/pkg/tsdb/grafana-testdata-datasource/scenarios.go#L33) uses a [helper method](https://github.com/grafana/grafana/blob/623ee3a2be5c4cd84c61b6bbe82a32d18cc29828/pkg/tsdb/grafana-testdata-datasource/scenarios.go#L204-L207) to register each query type handler. The latter also shows how you can wrap the actual handler in another handler to apply common functionality or middleware to all handlers, for example logging and traces. 