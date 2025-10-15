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

import ImplementResourceHandler from '@shared/implement-resource-handler.md';

# Add resource handler for data source plugins

You can add a resource handler to your data source backend to extend the Grafana HTTP API with your own data source-specific routes. This guide explains why you may want to add [resource](../../key-concepts/backend-plugins/#resources) handlers and some common ways for doing so.

## Uses of resource handlers

The primary way for a data source to retrieve data from a backend is through the [query method](../../tutorials/build-a-data-source-plugin#3-implement-your-query-editor). But sometimes your data source needs to request data on demand; for example, to offer auto-completion automatically inside the data source’s query editor.

Resource handlers are also useful for building control panels that allow the user to write back to the data source. For example, you could add a resource handler to update the state of an IoT device.

<ImplementResourceHandler />

## Accessing datasource resources

Once implemented you can access the resources using the Grafana HTTP API and from the frontend.

### Using the Grafana HTTP API

You can access the resources through the Grafana HTTP API by using the endpoint, `http://<GRAFANA_HOSTNAME>:<PORT>/api/datasources/uid/<DATASOURCE_UID>/resources{/<RESOURCE>}`. The `DATASOURCE_UID` is the data source unique identifier (UID) that uniquely identifies your data source and the `RESOURCE` depends on how the resource handler is implemented and what resources (routes) are supported.

With the above example you can access the following resources:

- HTTP GET `http://<GRAFANA_HOSTNAME>:<PORT>/api/datasources/uid/<DATASOURCE_UID>/resources/namespaces`
- HTTP GET `http://<GRAFANA_HOSTNAME>:<PORT>/api/datasources/uid/<DATASOURCE_UID>/resources/projects`

:::tip

To verify the data source UID, you can enter `window.grafanaBootData.settings.datasources` in your browser's developer tools console, to list all the configured data sources in your Grafana instance.

:::

### From the frontend

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
}
```

For example, in your query editor component, you can access the data source instance from the `props` object and use `getNamespaces` to send a HTTP GET request to `http://<GRAFANA_HOSTNAME>:<PORT>/api/datasources/uid/<DATASOURCE_UID>/resources/namespaces`:

```typescript
const namespaces = await props.datasource.getNamespaces();
```

## Additional examples

Some other examples of using resource handlers and the [`httpadapter`](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter) package:

- The [datasource-basic](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/datasource-basic) example.
- Grafana's built-in TestData datasource, [create resource handler](https://github.com/grafana/grafana/blob/5687243d0b3bad06c4da809f925cfdf3d32c5a16/pkg/tsdb/grafana-testdata-datasource/testdata.go#L45) and [register routes](https://github.com/grafana/grafana/blob/5687243d0b3bad06c4da809f925cfdf3d32c5a16/pkg/tsdb/grafana-testdata-datasource/resource_handler.go#L17-L28).
