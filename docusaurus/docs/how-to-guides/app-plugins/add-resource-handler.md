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

import ImplementResourceHandler from '@shared/implement-resource-handler.md';

# Add resource handler for app plugins

You can add a resource handler to your app backend to extend the Grafana HTTP API with your own app-specific routes. This guide explains why you may want to add [resource](../../key-concepts/backend-plugins/#resources) handlers and some common ways for doing so.

## Uses of resource handlers

The use case and functionality for an app is very broad and therefore also for uses of resource handlers. But in general, an app normally integrates with a HTTP service of some kind, e.g. a 3rd party service, to retrieve and send data. For example, this service might have

- specific authentication and authorization needs.
- a format not suitable to return to Grafana and the plugin frontend.

In addition, you might want to [secure your resources](implement-rbac-in-app-plugins.md#secure-backend-resources) so that only users with a certain permission can access those.

Resource handlers are also useful for building control panels that allow the user to write back to the app. For example, you could add a resource handler to update the state of an IoT device.

<ImplementResourceHandler />

## Accessing app resources

Once implemented you can access the resources using the Grafana HTTP API and from the frontend.

### Using the Grafana HTTP API

You can access the resources through the Grafana HTTP API by using the endpoint, `http://<GRAFANA_HOSTNAME>:<PORT>/api/plugins/<PLUGIN_ID>/resources{/<RESOURCE>}`. The `PLUGIN_ID` is the plugin identifier that uniquely identifies your app and the `RESOURCE` depends on how the resource handler is implemented and what resources (routes) are supported.

With the above example you can access the following resources:

- HTTP GET `http://<GRAFANA_HOSTNAME>:<PORT>/api/plugins/<PLUGIN_ID>/resources/namespaces`
- HTTP GET `http://<GRAFANA_HOSTNAME>:<PORT>/api/plugins/<PLUGIN_ID>/resources/projects`
- HTTP POST `http://<GRAFANA_HOSTNAME>:<PORT>/api/plugins/<PLUGIN_ID>/resources/device`

### From the frontend

You can access your resources using the `get` and `post` functions from the `backendSrv` runtime service. To provide a nicer and more convenient API for your components it's recommended to provide a helper class with functions for each route as shown in the following example:

```typescript
import { getBackendSrv } from '@grafana/runtime';

export class API {
  private backend = getBackendSrv();

  constructor(public PluginId: string) {}

  getNamespaces(): Promise<NamespacesResponse> {
    return this.backend.get(`/api/plugins/${this.PluginID}/resources/namespaces`);
  }

  getProjects(): Promise<ProjectsResponse> {
    return this.backend.get(`/api/plugins/${this.PluginID}/resources/projects`);
  }

  updateDevice(state: string): Promise<string> {
    return this.backend.post(`/api/plugins/${this.PluginID}/resources/device`, { state: state });
  }
}
```

For example, in your app or component you can instantiate your API class and use `getNamespaces` to send a HTTP GET request to `http://<GRAFANA_HOSTNAME>:<PORT>/api/plugins/<PLUGIN_ID>/resources/namespaces`

```typescript
const api = new API('my-app-id');
const namespaces = await api.getNamespaces();
```

As another example, you can use `updateDevice` to send a HTTP POST request to `http://<GRAFANA_HOSTNAME>:<PORT>/api/plugins/<PLUGIN_ID>/resources/device` with the provided JSON payload as the second argument:

```typescript
const result = await api.updateDevice('on');
```

## Additional examples

Some other examples of using resource handlers and the [`httpadapter`](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter) package:

- The [app-with-backend](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/app-with-backend) example:
  - [create resource handler](https://github.com/grafana/grafana-plugin-examples/blob/main/examples/app-with-backend/pkg/plugin/app.go) and [register routes](https://github.com/grafana/grafana-plugin-examples/blob/main/examples/app-with-backend/pkg/plugin/resources.go) in the backend.
  - use [backendSrv](https://github.com/grafana/grafana-plugin-examples/blob/main/examples/app-with-backend/src/pages/PageOne/PageOne.tsx) to call resources.
