---
id: add-backend-component
title: Add a backend component to an app plugin
description: How to add a backend component to an app plugin
keywords:
  - grafana
  - plugins
  - plugin
  - app
  - backend
---

import CreatePlugin from '@shared/create-plugin-backend.md';
import BackendPluginAnatomy from '@shared/backend-plugin-anatomy.md';
import TroubleshootPluginLoad from '@shared/troubleshoot-plugin-doesnt-load.md';

# Add a backend component to an app plugin

A backend component for an app plugin allows you to extend the app plugin for additional functionality such as custom authentication methods and integration with other services.

The following are typical use cases for backend components in app plugins:

- Use custom authentication methods that aren't supported in Grafana
- Use authorization checks that aren't supported in Grafana
- Run workloads on the server side
- Connect to non-HTTP services that normally can't be connected to from a browser

## Before you begin

Install the following prerequisites before adding a backend component:

- Go ([Version](https://github.com/grafana/plugin-tools/blob/main/packages/create-plugin/templates/backend/go.mod#L3))
- [Mage](https://magefile.org/)
- [LTS](https://nodejs.dev/en/about/releases/) version of Node.js
- [Docker](https://docs.docker.com/get-docker/)

## Create a new app plugin

<CreatePlugin pluginType="app" />

## Anatomy of a plugin with a backend component

<BackendPluginAnatomy pluginType="app" />

## Add authentication to your app plugin

To learn more about adding authentication to your app plugin (for example, to call a custom backend or third-party API) and handling secrets, refer to [Add authentication for app plugins](./add-authentication-for-app-plugins.md).

## Access app settings

Settings are part of the `AppInstanceSettings` struct. They are passed to the app plugin constructor as the second argument. For example:

```go title="src/app.go"
func NewApp(ctx context.Context, settings backend.AppInstanceSettings) (instancemgmt.Instance, error) {
  jsonData := settings.JSONData // json.RawMessage
  secureJsonData := settings.DecryptedSecureJSONData // map[string]string
}
```

You can also get the settings from a request `Context`:

```go title="src/resources.go"
func (a *App) handleMyRequest(w http.ResponseWriter, req *http.Request) {
  pluginConfig := backend.PluginConfigFromContext(req.Context())
  jsonData := pluginConfig.AppInstanceSettings.JSONData // json.RawMessage
}
```

## Add a custom endpoint to your app plugin

Here's how to add a `ServeMux` or `CallResource` endpoint to your app plugin.

### ServeMux (recommended)

Your scaffolded app plugin already has a default `CallResource` that uses [`ServeMux`](https://pkg.go.dev/net/http#ServeMux). It looks like this:

```go title="app.go"
type App struct {
	backend.CallResourceHandler
}

// NewApp creates a new example *App instance.
func NewApp(_ context.Context, _ backend.AppInstanceSettings) (instancemgmt.Instance, error) {
	var app App

	// Use an httpadapter (provided by the SDK) for resource calls. This allows us
	// to use a *http.ServeMux for resource calls, so we can map multiple routes
	// to CallResource without having to implement extra logic.
	mux := http.NewServeMux()
	app.registerRoutes(mux)
  // implement the CallResourceHandler interface
	app.CallResourceHandler = httpadapter.New(mux)

	return &app, nil
}
```

Now you can add custom endpoints to your app plugin.

The scaffolded code already contains a `resources.go` file with the `registerRoutes` function.

```go title="resources.go"
// this function already exists in the scaffolded app plugin
func (a *App) registerRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/myCustomEndpoint", a.handleMyCustomEndpoint)
}

func (a *App) handleMyCustomEndpoint(w http.ResponseWriter, r *http.Request) {
  // handle the request
  // e.g. call a third-party API
  w.Write([]byte("my custom response"))
  w.WriteHeader(http.StatusOK)
}
```

### CallResource

You can also add custom endpoints to your app plugin by adding a `CallResource` handler to your backend component directly. You must implement the logic to handle multiple requests.

```go title="app.go"
func (a *App) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	switch req.Path {
	case "myCustomEndpoint":
		sender.Send(&backend.CallResourceResponse{
			Status: http.StatusOK,
			Body:   []byte("my custom response"),
		})
	default:
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusNotFound,
		})
	}
	return nil
}
```

You can also see the data sources [documentation on resource handler](../data-source-plugins/add-resource-handler.md) which you can also apply to your app plugin.

### Call your custom endpoint from frontend code

To call your custom endpoint from frontend code, you can use the `fetch` function from `getBackendSrv`. For example:

```ts
import { getBackendSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

function getMyCustomEndpoint() {
  const response = await getBackendSrv().fetch({
    // replace ${PLUGIN_ID} with your plugin id
    url: '/api/plugins/${PLUGIN_ID}/myCustomEndpoint',
  });
  return await lastValueFrom(response);
}
```

## Troubleshooting

<TroubleshootPluginLoad />
