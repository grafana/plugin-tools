---
id: add-resource-handler
title: Add resource handler for data source plugins
description: Learn how to add a resource handler for data source plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - data source
  - datasource
  - resource
  - resource handler
---

# Add resource handler for data source plugins

You can add a resource handler to your data source backend to extend the Grafana HTTP API with your own data source-specific routes. This guide explains why you may want to add [resource](/introduction/backend-plugins#resources) handlers and some common ways for doing so.

## Uses of resource handlers

The primary way for a data source to retrieve data from a backend is through the [query method](./add-query-editor-help.md). But sometimes your data source needs to request data on demand; for example, to offer auto-completion automatically inside the data source’s query editor.

Resource handlers are also useful for building control panels that allow the user to write back to the data source. For example, you could add a resource handler to update the state of an IoT device.

## Implement the resource handler interface

To add a resource handler to your backend plugin, you need to implement the `backend.CallResourceHandler` interface for your data source struct.

```go
func (d *MyDatasource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
    return sender.Send(&backend.CallResourceResponse{
        Status: http.StatusOK,
        Body: []byte("Hello, world!"),
    })
}
```

You can then access your resources through the following endpoint: `http://<GRAFANA_HOSTNAME>:<PORT>/api/datasources/uid/<DATASOURCE_UID>/resources`

In this example code, `DATASOURCE_UID` is the data source unique identifier (UID) that uniquely identifies your data source.

:::tip

To verify the data source UID, you can enter `window.grafanaBootData.settings.datasources` in your browser's developer tools console, to list all the configured data sources in your Grafana instance.

:::

## Add support for multiple routes

To support multiple routes in your data source plugin, you can use a switch with the `req.Path`:

```go
func (d *MyDatasource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	switch req.Path {
	case "namespaces":
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusOK,
			Body:   []byte(`{ namespaces: ["ns-1", "ns-2"] }`),
		})
	case "projects":
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusOK,
			Body:   []byte(`{ projects: ["project-1", "project-2"] }`),
		})
	default:
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusNotFound,
		})
	}
}
```

You can also query your resources using the `getResource` and `postResource` helpers from the `DataSourceWithBackend` class.

For example, in your query editor component, you can access the data source instance from the `props` object:

```
const namespaces = await props.datasource.getResource('namespaces');
props.datasource.postResource('device', { state: "on" });
```

## Advanced use cases

If you have some more advanced use cases or want to use a more Go-agnostic approach for handling resources, you can use the regular [`http.Handler`](https://pkg.go.dev/net/http#Handler). You can do so by using a package provided by the [Grafana Plugin SDK for Go](../../introduction/grafana-plugin-sdk-for-go.md) named [`httpadapter`](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter). This package provides support for handling resource calls using an [`http.Handler`](https://pkg.go.dev/net/http#Handler).

Using [`http.Handler`](https://pkg.go.dev/net/http#Handler) allows you to also use Go’s built-in router functionality called [`ServeMux`](https://pkg.go.dev/net/http#ServeMux) or your preferred HTTP router library (for example, [`gorilla/mux`](https://github.com/gorilla/mux)).

An alternative to using the `CallResource` method shown in the [above example](#implement-the-resource-handler-interface) is to use [`httpadapter`](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter) and [`ServeMux`](https://pkg.go.dev/net/http#ServeMux) as shown below:

```go
package mydatasource

import (
	"context"
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
)

type MyDatasource struct {
	resourceHandler backend.CallResourceHandler
}

func New() *MyDatasource {
	ds := &MyDatasource{}
	mux := http.NewServeMux()
	mux.HandleFunc("/namespaces", ds.handleNamespaces)
	mux.HandleFunc("/projects", ds.handleProjects)
	ds.resourceHandler := httpadapter.New(mux)
	return ds
}

func (d *MyDatasource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	return d.resourceHandler.CallResource(ctx, req)
}

func (d *MyDatasource) handleNamespaces(rw http.ResponseWriter, req *http.Request) {
	_, err := rw.Write([]byte(`{ namespaces: ["ns-1", "ns-2"] }`))
	if err != nil {
		return
	}
	rw.WriteHeader(http.StatusOK)
}

func (d *MyDatasource) handleProjects(rw http.ResponseWriter, req *http.Request) {
	_, err := rw.Write([]byte(`{ projects: ["project-1", "project-2"] }`))
	if err != nil {
		return
	}
	rw.WriteHeader(http.StatusOK)
}
```

:::note

Using some other HTTP router library with above example should be straightforward. Just replace the use of [`ServeMux`](https://pkg.go.dev/net/http#ServeMux) with another router.

:::

### What if you need access to the backend plugin context?

Use the `PluginConfigFromContext` function to access `backend.PluginContext`:

```
func (d *MyDatasource) handleNamespaces(rw http.ResponseWriter, req *http.Request) {
	pCtx := httpadapter.PluginConfigFromContext(req.Context())

	bytes, err := json.Marshal(pCtx.User)
	if err != nil {
		rw.WriteHeader(http.StatusInternalServerError)
	}

	_, err := rw.Write(bytes)
	if err != nil {
		return
	}
	rw.WriteHeader(http.StatusOK)
}
```
## Additional examples

Some other examples of using resource handlers and the [`httpadapter`](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter) package:

- The [datasource-basic](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/datasource-basic) example:
  - [create resource handler](https://github.com/grafana/grafana-plugin-examples/blob/309228fffb09c092c08dbd3d17f45a656b2ec3c6/examples/datasource-basic/pkg/plugin/datasource.go#L39) and [register routes](https://github.com/grafana/grafana-plugin-examples/blob/main/examples/datasource-basic/pkg/plugin/resource_handler.go) in the backend. 
  - [fetch](https://github.com/grafana/grafana-plugin-examples/blob/309228fffb09c092c08dbd3d17f45a656b2ec3c6/examples/datasource-basic/src/components/QueryEditor/QueryEditor.tsx#L15) and [populate query types in a drop-down](https://github.com/grafana/grafana-plugin-examples/blob/309228fffb09c092c08dbd3d17f45a656b2ec3c6/examples/datasource-basic/src/components/QueryEditor/QueryEditor.tsx#L42) in the query editor component in the frontend. Fetching is done in a [separate function](https://github.com/grafana/grafana-plugin-examples/blob/309228fffb09c092c08dbd3d17f45a656b2ec3c6/examples/datasource-basic/src/components/QueryEditor/useQueryTypes.tsx#L13) which calls the [getAvailableQueryTypes function of the datasource](https://github.com/grafana/grafana-plugin-examples/blob/309228fffb09c092c08dbd3d17f45a656b2ec3c6/examples/datasource-basic/src/datasource.ts#L21-L23).
- Grafana's built-in TestData datasource, [create resource handler](https://github.com/grafana/grafana/blob/5687243d0b3bad06c4da809f925cfdf3d32c5a16/pkg/tsdb/grafana-testdata-datasource/testdata.go#L45) and [register routes](https://github.com/grafana/grafana/blob/5687243d0b3bad06c4da809f925cfdf3d32c5a16/pkg/tsdb/grafana-testdata-datasource/resource_handler.go#L17-L28).

