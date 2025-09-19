## Implement the resource handler interface

To add a resource handler to your plugin backend component, you need to implement the `backend.CallResourceHandler` interface.

There are two ways you can implement this in your plugin, [using the `httpadapter` package](#using-the-httpadapter-package) or [manually implementing it](#manually-implementing-backendcallresourcehandler) in your plugin.

### Using the `httpadapter` package

The [`httpadapter`](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter) package provided by the [Grafana Plugin SDK for Go](../../key-concepts/backend-plugins/grafana-plugin-sdk-for-go) is the recommended way for handling resources. This package provides support for handling resource calls using using the [`http.Handler`](https://pkg.go.dev/net/http#Handler) interface and allows responding to HTTP requests in a more Go-agnostic way and makes it easier to support multiple routes and methods (GET, POST etc).

Using [`http.Handler`](https://pkg.go.dev/net/http#Handler) allows you to also use Go’s built-in router functionality called [`ServeMux`](https://pkg.go.dev/net/http#ServeMux) or your preferred HTTP router library (for example, [`gorilla/mux`](https://github.com/gorilla/mux)).

:::note

Go 1.22 [includes routing enhancement](https://go.dev/blog/routing-enhancements) that adds support for method matching and wildcards using the [`ServeMux`](https://pkg.go.dev/net/http#ServeMux).

:::

In the following example we demonstrate using the `httpadapter` package, `ServeMux` and `http.Handler` to add support for retrieving namespaces (`/namespaces`), projects (`/projects`) and updating the state of some device (`/device`) :

```go
package myplugin

import (
  "context"
  "net/http"

  "github.com/grafana/grafana-plugin-sdk-go/backend"
  "github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
)

type MyPlugin struct {
  resourceHandler backend.CallResourceHandler
}

func New() *MyPlugin {
  p := &MyPlugin{}
  mux := http.NewServeMux()
  mux.HandleFunc("/namespaces", p.handleNamespaces)
  mux.HandleFunc("/projects", p.handleProjects)
  p.resourceHandler := httpadapter.New(mux)
  return p
}

func (p *MyPlugin) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
  return p.resourceHandler.CallResource(ctx, req, sender)
}

func (p *MyPlugin) handleNamespaces(rw http.ResponseWriter, req *http.Request) {
  rw.Header().Add("Content-Type", "application/json")
  _, err := rw.Write([]byte(`{ "namespaces": ["ns-1", "ns-2"] }`))
  if err != nil {
    return
  }
  rw.WriteHeader(http.StatusOK)
}

func (p *MyPlugin) handleProjects(rw http.ResponseWriter, req *http.Request) {
  rw.Header().Add("Content-Type", "application/json")
  _, err := rw.Write([]byte(`{ "projects": ["project-1", "project-2"] }`))
  if err != nil {
    return
  }
  rw.WriteHeader(http.StatusOK)
}
```

#### Accessing the plugin context

You can use the [backend.PluginConfigFromContext](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend#PluginConfigFromContext) function to access [backend.PluginContext](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend#PluginContext). This holds contextual information about a plugin request, such as the user performing the request:

```go
func (p *MyPlugin) handleSomeRoute(rw http.ResponseWriter, req *http.Request) {
	pCtx := backend.PluginConfigFromContext(req.Context())
	bytes, err := json.Marshal(pCtx.User)
	if err != nil {
		return
	}

	rw.Header().Add("Content-Type", "application/json")
	_, err := rw.Write(bytes)
	if err != nil {
		return
	}
	rw.WriteHeader(http.StatusOK)
}
```

### Manually implementing `backend.CallResourceHandler`

Manually implementing the `backend.CallResourceHandler` interface might be enough for the basic needs. To support a couple of different routes retrieving data you can use a switch with the `req.Path`:

```go
func (p *MyPlugin) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
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
