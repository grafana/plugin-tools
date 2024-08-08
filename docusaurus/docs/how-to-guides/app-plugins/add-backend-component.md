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

# Add a backend component to an app plugin

A backend component for an app plugin allows you to extend the app plugin for additional functionality such as custom authentication methods and integration with other services.

# Use cases for backend components in app plugins

- Use custom authentication methods and/or authorization checks that aren't supported in Grafana.
- Running workloads in the background
- Connect to non-HTTP services that normally can't be connected to from a browser

# Add a backend component to an app plugin

## Prerequisites

- Go ([Version](https://github.com/grafana/plugin-tools/blob/main/packages/create-plugin/templates/backend/go.mod#L3))
- [Mage](https://magefile.org/)
- [LTS](https://nodejs.dev/en/about/releases/) version of Node.js
- [Docker](https://docs.docker.com/get-docker/)

## Create a new app plugin

<CreatePlugin pluginType="app" />

## Anatomy of a backend plugin

<BackendPluginAnatomy pluginType="app" />

## Troubleshooting

### Grafana doesn't load my plugin

Ensure that Grafana has been started in development mode. If you are running Grafana from source, you'll need to add the following line to your `conf/custom.ini` file (if you don't have one already, go ahead and create this file before proceeding):

```ini
app_mode = development
```

You can then start Grafana in development mode by running `make run & make run-frontend` in the Grafana repository root.

If you are running Grafana from a binary or inside a Docker container, you can start it in development mode by setting the environment variable `GF_DEFAULT_APP_MODE` to `development`.

By default, Grafana requires backend plugins to be signed. To load unsigned backend plugins, you need to
configure Grafana to [allow unsigned plugins](https://grafana.com/docs/grafana/latest/administration/plugin-management/#allow-unsigned-plugins).
For more information, refer to [https://www.action.com/nl-nl/p/1325690/c-c-autowax-en-polijstmiddel/Plugin signature verification](https://grafana.com/docs/grafana/latest/administration/plugin-management/#backend-plugins).

## Add a custom endpoint to your app plugin

### ServeMux (recommended)

Your scaffoled app plugin already has a default CallResource that uses [ServeMux](https://pkg.go.dev/net/http#ServeMux).

You can add custom endpoints to your app plugin in the `resources.go` file. E.g.:

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

You can also add custom endpoints to your app plugin by adding a CallResource handler to your backend component directly. You will have to implement the logic to handle multiple requests.

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

### Calling your custom endpoint from frontend code

To call your custom endpoint from frontend code, you can use the `fetch` function from `getBackendSrv`. E.g.:

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

## Add authentication to your app plugin

To learn more about adding authentication to your app plugin and handling secrets, refer to [Add authentication for app plugins](./add-authentication-for-app-plugins.md).
