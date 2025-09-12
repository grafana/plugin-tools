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

An app often integrates with a HTTP service of some kind, e.g. a 3rd party service, to retrieve and send data. For example, this service might have specific authentication and authorization needs or a response format not suitable to return to Grafana and the plugin frontend.

In addition, you might want to [secure your resources](implement-rbac-in-app-plugins.md#secure-backend-resources) so that only users with a certain permission can access certain routes.

Resource handlers are also useful for building control panels that allow the user to write back to the app. For example, you could add a resource handler to update the state of an IoT device.

<ImplementResourceHandler />

## Accessing app resources

Once implemented you can access the resources using the Grafana HTTP API and from the frontend.

### Using the Grafana HTTP API

You can access the resources through the Grafana HTTP API by using the endpoint, `http://<GRAFANA_HOSTNAME>:<PORT>/api/plugins/<PLUGIN_ID>/resources{/<RESOURCE>}`. The `PLUGIN_ID` is the plugin identifier that uniquely identifies your app and the `RESOURCE` depends on how the resource handler is implemented and what resources (routes) are supported.

With the above example you can access the following resources:

- HTTP GET `http://<GRAFANA_HOSTNAME>:<PORT>/api/plugins/<PLUGIN_ID>/resources/namespaces`
- HTTP GET `http://<GRAFANA_HOSTNAME>:<PORT>/api/plugins/<PLUGIN_ID>/resources/projects`

### From the frontend

You can access your resources in a compontent using the `get` function of the `backendSrv` runtime service to send a HTTP GET request to `http://<GRAFANA_HOSTNAME>:<PORT>/api/plugins/<PLUGIN_ID>/resources/namespaces`

```typescript
import { getBackendSrv } from '@grafana/runtime';

const namespaces = await getBackendSrv().get(`/api/plugins/<PLUGIN_ID>/resources/namespaces`);
```
