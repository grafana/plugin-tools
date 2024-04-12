---
id: add-resource-handler
title: Add resource handler for data source plugins
description: Add a resource handler for data source plugins.
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

You can add a resource handler to your data source to extend the Grafana HTTP API with your own data source-specific routes. This guide explains why you may want to add resource handlers and some common ways for doing so.

## Uses of resource handlers

The primary way for a data source to retrieve data from a backend is through the [query method](./add-query-editor-help.md). But sometimes your data source needs to request data on demand; for example, to offer auto-completion automatically inside the data source’s query editor.

Resource handler are also useful for building control panels that allow the user to write back to the data source. For example, you could add a resource handler to update the state of an IoT device.

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

You can then access your resources through the following endpoint: `http://<grafana instance host:port>/api/datasources/uid/<DATASOURCE_IUD>/resources`

In this example code, `DATASOURCE_UID` is the data source unique identifier (UID) that uniquely identifies your data source.

:::tip

To verify the data source ID, you can enter `window.grafanaBootData.settings.datasources` in the Developer Console, to list all the data source definitions in your Grafana instance.

:::

## Add support for multiple routes

To support multiple routes in your data source plugin, you can use a switch with the `req.Path`:

```
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

With this, your plugin now has its own REST API that you can query from your query editor, using `BackendSrv.fetch()`.

```
const observable = getBackendSrv()
  .fetch({
    url: `/api/datasources/${props.datasource.id}/resources/namespaces`,
  });

const response = await lastValueFrom(observable);
```

In this example code, `props.datasource.id` gives you the data source ID of the query that’s being edited. For more information on how to use `BackendSrv.fetch()`, refer to [this forum post](https://community.grafana.com/t/how-to-migrate-from-backendsrv-datasourcerequest-to-backendsrv-fetch/58770).

## Query resources with additional helpers

You can also query your resources using the `getResource` and `postResource` helpers from the `DataSourceWithBackend` class.

For example, in your query editor component, you can access the data source instance from the `props` object:

```
const namespaces = await props.datasource.getResource('namespaces');
props.datasource.postResource('device', { state: "on" });
```

## Advanced use cases

If you have some more advanced use cases or want to use a more Go-agnostic approach for handling resources, you can use the regular [`http.Handler`](https://pkg.go.dev/net/http#Handler). You can do so by using a package provided by the [Grafana Plugin SDK for Go](../../introduction/grafana-plugin-sdk-for-go.md) named [`httpadapter`](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter). This package provides support for handling resource calls using an [`http.Handler`](https://pkg.go.dev/net/http#Handler).

What’s interesting with using [`http.Handler`](https://pkg.go.dev/net/http#Handler) is that you can use it with Go’s builtin router functionality called [`ServeMux`](https://pkg.go.dev/net/http#ServeMux) or use your preferred HTTP router library (for example, [`gorilla/mux`](https://github.com/gorilla/mux)).

An alternative to using the [`CallResource` method shown in the above example](#add-resource-handler-for-data-source-plugins) is to use [`httpadapter`](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter) and [`ServeMux`](https://pkg.go.dev/net/http#ServeMux) as shown below:

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

### Additional examples

Some other examples of using the [`httpadapter`](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter) package can be found for some of the built-in Grafana data sources:

- Test data source [grafana/testdata.go](https://github.com/grafana/grafana/blob/30aa24a18396f61bfbcbfbeee78b1c0d23685fc3/pkg/tsdb/testdatasource/testdata.go#L41-L42) at 30aa24a18396f61bfbcbfbeee78b1c0d23685fc3 - See code at the [grafana/grafana](https://github.com/grafana/grafana/blob/30aa24a18396f61bfbcbfbeee78b1c0d23685fc3/pkg/tsdb/testdatasource/testdata.go#L41-L42) repo.
- Test data source [grafana/resource_handler.go](https://github.com/grafana/grafana/blob/30aa24a18396f61bfbcbfbeee78b1c0d23685fc3/pkg/tsdb/testdatasource/resource_handler.go#L18) at 30aa24a18396f61bfbcbfbeee78b1c0d23685fc3 - See code at the [grafana/grafana](https://github.com/grafana/grafana/blob/30aa24a18396f61bfbcbfbeee78b1c0d23685fc3/pkg/tsdb/testdatasource/resource_handler.go#L18) repo.

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

Adding resource handlers to your backend plugins opens up more ways to make your plugin more dynamic.
