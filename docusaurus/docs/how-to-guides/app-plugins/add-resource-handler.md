---
id: add-resource-handler
title: Add resource handler for app plugins
description: Learn how to add a resource handler for app plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - app
  - resource
  - resource handler
---

# Add resource handler for app plugins

You can add a resource handler to your app backend to extend the Grafana HTTP API with your own app-specific routes. This guide explains why you may want to add [resource](../../key-concepts/backend-plugins/#resources) handlers and some common ways for doing so.

## Uses of resource handlers

The primary way for a data source to retrieve data from a backend is through the [query method](../../tutorials/build-a-data-source-plugin#define-a-query). But sometimes your data source needs to request data on demand; for example, to offer auto-completion automatically inside the data source’s query editor.

Resource handlers are also useful for building control panels that allow the user to write back to the data source. For example, you could add a resource handler to update the state of an IoT device.

## Implement the resource handler interface

To add a resource handler to your app plugin, you need to implement the `backend.CallResourceHandler` interface for your app struct.

```go
func (a *MyApp) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
    return sender.Send(&backend.CallResourceResponse{
        Status: http.StatusOK,
        Body: []byte("Hello, world!"),
    })
}
```

You can then access your resources through the following endpoint: `http://<GRAFANA_HOSTNAME>:<PORT>/api/plugins/<PLUGIN_ID>/resources`

In this example code, `PLUGIN_ID` is the plugin identifier that uniquely identifies your app.

## Add support for multiple routes

To support multiple routes in your app plugin you have a couple of options depending on requirements and needs.
If you only need basic support for a couple of different routes retrieving data you can use a switch with the `req.Path`:

```go
func (a *MyApp) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	if req.Method != http.MethodGet {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusNotFound,
		})
	}

	switch req.Path {
	case "namespaces":
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusOK,
			Body:   []byte(`{ "namespaces": ["ns-1", "ns-2"] }`),
		})
	case "projects":
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusOK,
			Body:   []byte(`{ "projects": ["project-1", "project-2"] }`),
		})
	default:
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusNotFound,
		})
	}
}
```

Supporting additional routes and methods (GET, POST etc) pretty quickly gets cumbersome and creates code that might be hard to maintain, test and read. Here we recommend to use the more Go-agnostic approach for handling resources and use the regular [`http.Handler`](https://pkg.go.dev/net/http#Handler). You can do so by using a package provided by the [Grafana Plugin SDK for Go](../../key-concepts/backend-plugins/grafana-plugin-sdk-for-go) named [`httpadapter`](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter). This package provides support for handling resource calls using an [`http.Handler`](https://pkg.go.dev/net/http#Handler).

Using [`http.Handler`](https://pkg.go.dev/net/http#Handler) allows you to also use Go’s built-in router functionality called [`ServeMux`](https://pkg.go.dev/net/http#ServeMux) or your preferred HTTP router library (for example, [`gorilla/mux`](https://github.com/gorilla/mux)).

:::note

Go 1.22 [includes routing enhancement](https://go.dev/blog/routing-enhancements) that adds support for method matching and wildcards using the [`ServeMux`](https://pkg.go.dev/net/http#ServeMux).

:::

Lets change and extend the above example by using [`httpadapter`](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter) and [`ServeMux`](https://pkg.go.dev/net/http#ServeMux) and introduce a new `/device` route for updating the state of some device:

```go
package myapp

import (
	"context"
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
)

type MyApp struct {
	resourceHandler backend.CallResourceHandler
}

func New() *MyApp {
	app := &MyApp{}
	mux := http.NewServeMux()
	mux.HandleFunc("/namespaces", app.handleNamespaces)
	mux.HandleFunc("/projects", app.handleProjects)
	mux.HandleFunc("/device", app.updateDevice)
	app.resourceHandler := httpadapter.New(mux)
	return app
}

func (a *MyApp) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	return d.resourceHandler.CallResource(ctx, req)
}

func (a *MyApp) handleNamespaces(rw http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		return
	}

	ctxLogger := backend.Logger.FromContext(req.Context())

	_, err := rw.Write([]byte(`{ "namespaces": ["ns-1", "ns-2"] }`))
	if err != nil {
		ctxLogger.Error("Failed to write response", "error", err)
		return
	}
	rw.WriteHeader(http.StatusOK)
}

func (a *MyApp) handleProjects(rw http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		return
	}

	ctxLogger := backend.Logger.FromContext(req.Context())

	_, err := rw.Write([]byte(`{ "projects": ["project-1", "project-2"] }`))
	if err != nil {
		ctxLogger.Error("Failed to write response", "error", err)
		return
	}
	rw.WriteHeader(http.StatusOK)
}

func (a *MyApp) updateDevice(rw http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		return
	}

	if req.Body == nil {
		rw.WriteHeader(http.StatusBadRequest)
		return
	}

	ctxLogger := backend.Logger.FromContext(req.Context())

	defer func() {
		if err := req.Body.Close(); err != nil {
			ctxLogger.Warn("Failed to close response body", "error", err)
		}
	}()

	var payload map[string]any
	b, err := io.ReadAll(req.Body)
	if err != nil {
		ctxLogger.Error("Failed to read request body to bytes", "error", err)
		rw.WriteHeader(http.StatusInternalServerError)
		return
	}

	err := json.Unmarshal(b, &payload)
	if err != nil {
		ctxLogger.Error("Failed to unmarshal request body to JSON", "error", err)
		rw.WriteHeader(http.StatusInternalServerError)
		return
	}

	state := payload["state"]
	// update device with state...

	_, err := rw.Write([]byte(`{ "message": "device updated"] }`))
	if err != nil {
		ctxLogger.Error("Failed to write response", "error", err)
		return
	}

	rw.WriteHeader(http.StatusOK)
}
```

:::note

Using some other HTTP router library with above example should be straightforward. Just replace the use of [`ServeMux`](https://pkg.go.dev/net/http#ServeMux) with another router.

:::

### What if you need access to the backend plugin context?

Use the `backend.PluginConfigFromContext` function to access `backend.PluginContext`:

```go
func (a *MyApp) handleNamespaces(rw http.ResponseWriter, req *http.Request) {
	pCtx := backend.PluginConfigFromContext(req.Context())
	ctxLogger := backend.Logger.FromContext(req.Context())

	bytes, err := json.Marshal(pCtx.User)
	if err != nil {
		ctxLogger.Error("Failed to marshal user to JSON bytes", "error", err)
		rw.WriteHeader(http.StatusInternalServerError)
		return
	}

	_, err := rw.Write(bytes)
	if err != nil {
		ctxLogger.Error("Failed to write response", "error", err)
		return
	}

	rw.WriteHeader(http.StatusOK)
}
```

## Accessing app resources from the frontend

You can query your resources using the `getResource` and `postResource` helpers from the `DataSourceWithBackend` class. To provide a nicer and more convenient API for your components it's recommended to extend your datasource class and instance with functions for each route as shown in the following example:

```typescript
export class MyDataSource extends DataSourceWithBackend<MyQuery, MyDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
  }

  getNamespaces(): Promise<NamespacesResponse> {
    return this.getResource('/namespaces');
  }

  getProjects(): Promise<ProjectsResponse> {
    return this.getResource('/projects');
  }

  updateDevice(state: string): Promise<string> {
    return this.postResource('device', { state: state });
  }
}
```

For example, in your query editor component, you can access the data source instance from the `props` object and use `getNamespaces` to send a HTTP GET request to `http://<GRAFANA_HOSTNAME>:<PORT>/api/datasources/uid/<DATASOURCE_UID>/resources/namespaces`:

```typescript
const namespaces = await props.datasource.getNamespaces();
```

As another example, you can use `updateDevice` to send a HTTP POST request to `http://<GRAFANA_HOSTNAME>:<PORT>/api/datasources/uid/<DATASOURCE_UID>/resources/device` with the provided JSON payload as the second argument:

```typescript
const result = await props.datasource.updateDevice('on');
```

## Additional examples

Some other examples of using resource handlers and the [`httpadapter`](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter) package:

- The [app-with-backend](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/app-with-backend) example:
  - [create resource handler](https://github.com/grafana/grafana-plugin-examples/blob/309228fffb09c092c08dbd3d17f45a656b2ec3c6/examples/datasource-basic/pkg/plugin/datasource.go#L39) and [register routes](https://github.com/grafana/grafana-plugin-examples/blob/main/examples/datasource-basic/pkg/plugin/resource_handler.go) in the backend.
  - [fetch](https://github.com/grafana/grafana-plugin-examples/blob/309228fffb09c092c08dbd3d17f45a656b2ec3c6/examples/datasource-basic/src/components/QueryEditor/QueryEditor.tsx#L15) and [populate query types in a drop-down](https://github.com/grafana/grafana-plugin-examples/blob/309228fffb09c092c08dbd3d17f45a656b2ec3c6/examples/datasource-basic/src/components/QueryEditor/QueryEditor.tsx#L42) in the query editor component in the frontend. Fetching is done in a [separate function](https://github.com/grafana/grafana-plugin-examples/blob/309228fffb09c092c08dbd3d17f45a656b2ec3c6/examples/datasource-basic/src/components/QueryEditor/useQueryTypes.tsx#L13) which calls the [getAvailableQueryTypes function of the datasource](https://github.com/grafana/grafana-plugin-examples/blob/309228fffb09c092c08dbd3d17f45a656b2ec3c6/examples/datasource-basic/src/datasource.ts#L21-L23).
- Grafana's built-in TestData datasource, [create resource handler](https://github.com/grafana/grafana/blob/5687243d0b3bad06c4da809f925cfdf3d32c5a16/pkg/tsdb/grafana-testdata-datasource/testdata.go#L45) and [register routes](https://github.com/grafana/grafana/blob/5687243d0b3bad06c4da809f925cfdf3d32c5a16/pkg/tsdb/grafana-testdata-datasource/resource_handler.go#L17-L28).
