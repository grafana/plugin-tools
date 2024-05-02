---
id: fetch-data-from-frontend
title: Fetch data from frontend code using the data proxy
description: Learn how to use the data proxy API to fetch data from frontend code in data source and app plugins in Grafana
keywords:
  - grafana
  - plugins
  - data proxy
  - frontend
  - data source
  - CORS
---

# Fetch data from frontend data source and app plugins

Along with the JavaScript [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), the Grafana data proxy is used to fetch data from a Grafana data source plugin or app plugin.

The data proxy is especially useful

- for overcoming cross-site (CORS) limitations, or
- for performing authenticated requests, or
- for sending other sensitive data from your plugin configuration to Grafana.

This guide explains how the data proxy works and explores common issues in its usage.

## How does it work?

Instead of performing a request directly from the browser to the server, you perform the request through the Grafana backend server, which handles it and returns the response to the plugin.

- **Without data proxy**: Without a data proxy the requests go directly from the browser to the third-party server.
- **With data proxy**: Because the request to the third-party server happens from the Grafana backend, there are no restrictions in CORS, and you can instruct Grafana to send the request authenticated or using sensitive data stored in the plugin configuration.

## How to use the data proxy

Notice that you can only make use of the data proxy from data source and app plugins. _You can't use the data proxy from panel plugins._

### Step 1: Declare your route in your plugin metadata

You first need to set up the routes in your `plugin.json` metadata.

```json title="src/plugin.json"
"routes": [
	{
	  "path": "placeholder",
	  "url": "https://jsonplaceholder.typicode.com"
	}
],
```

You can see more advanced options to define your routes to include dynamic parameters.

:::note

You must build your plugin and restart the Grafana server every time you modify your `plugin.json` file.

:::

### Step 2: Fetch data from your frontend code

In your data source plugin, you can now fetch data by using the proxy URL. Here's a minimal example for your data source plugin using [JSONPlaceholder](https://jsonplaceholder.typicode.com/):

```typescript
import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  FieldType,
  MutableDataFrame,
} from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

type TODO = {
  title: string;
  id: number;
};

export class DataSource extends DataSourceApi {
  baseUrl: string;
  constructor(instanceSettings: DataSourceInstanceSettings) {
    super(instanceSettings);
    // notice we are storing the URL from the instanceSettings
    this.baseUrl = instanceSettings.url!;
  }

  async query(options: DataQueryRequest): Promise<DataQueryResponse> {
    const response = getBackendSrv().fetch<TODO[]>({
      // notice we are using the `placeholder` as defined
      // in the routes "path". Everything passed after will
      // be appended to the API URL
      url: `${this.baseUrl}/placeholder/todos`,
    });
    // backendSrv fetch returns an observable object
    // we should unwrap with rxjs
    const responseData = await lastValueFrom(response);
    const todos = responseData.data;

    // we'll return the same todos for all queries in this example
    // in a real data source each target should fetch the data
    // as necessary.
    const data = options.targets.map((target) => {
      return new MutableDataFrame({
        refId: target.refId,
        fields: [
          { name: 'Id', type: FieldType.number, values: todos.map((todo) => todo.id) },
          { name: 'Title', type: FieldType.string, values: todos.map((todo) => todo.title) },
        ],
      });
    });

    return { data };
  }

  async testDatasource() {
    return {
      status: 'success',
      message: 'Success',
    };
  }
}
```

## Dynamic values and settings interpolation in routes

You can use dynamic values for handling user input, authenticating requests, debugging, or handling special headers.

### Interpolation with user-provided values

It is most likely that your plugin won't have a hard-coded API URL, but it will instead use user-provided values. For these cases, you can use interpolation of variables in your routes.

**Example:**

```json title="src/plugin.json"
"routes": [
	{
	  "path": "interpolation",
	  "url": "{{ .JsonData.apiUrl }}"
	}
],
```

The configuration page should ask the user to populate this `apiUrl`. Grafana uses the `apiUrl` value when calling this endpoint.

Here's an example of a configuration form:

```typescript title="src/ConfigEditor.tsx"
export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props;
  const { jsonData } = options;

  const onApiUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        // notice we set the apiUrl value inside jsonData
        apiUrl: event.target.value,
      },
    });
  };

  return (
    <InlineField label="apiUrl" labelWidth={12}>
      <Input
        onChange={onApiUrlChange}
        value={jsonData.apiUrl || ''}
        placeholder="json field returned to frontend"
        width={40}
      />
    </InlineField>
  );
}
```

Once the field is set correctly, you may use it inside your data source. Following the previous example for the data source code, you can now simply use it like so:

```typescript
const response = getBackendSrv().fetch<TODO[]>({
  // Notice we use `interpolation` as defined
  // in the route path.
  // See the previous examples to see where
  // this.baseUrl comes from.
  url: `${this.baseUrl}/interpolation`,
});
```

### Use other HTTP methods (for example, POST, PUT, DELETE) with the data proxy

You can specify the method directly in the `fetch` method. Your routes in `src/plugin.json` remain the same:

```typescript
const response = getBackendSrv().fetch<TODO[]>({
  url: `${this.baseUrl}`,
  method: 'POST',
  data: dataToSendViaPost,
});
```

### Add authentication to your requests using the data proxy

To learn about adding authentication to the data proxy, refer to our [documentation](./add-authentication-for-data-source-plugins.md).

### Debug requests from the data proxy

If you want to debug the requests that are going from the Grafana backend to your API, enable the data proxy logging in the [configuration](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#dataproxy).

You must also [enable debug logs](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#mode) in Grafana to be able to see the data proxy logs in your Grafana configuration file.

**Example:**

```
[log]
level = debug

[dataproxy]
logging = true
```

With this configuration, the Grafana server output shows the requests going out to your API from the data proxy.

### Send special headers using the data proxy

You can send special headers using the data proxy. Here's an example of a route with special headers:

```json title="src/plugin.json"
"routes": [
{
	"path": "example",
	"url": "https://api.example.com",
	"headers": [
		{
		"name": "MyHeader",
		"content": "{{ .JsonData.headerValue }}"
		}
	]
}]
```

## Use the data proxy within an app plugin

The setup of routes in your `plugin.json` metadata remains the same as in a data source plugin; however, since app plugins don't receive the URL as part of the props, the URL is constructed like this:

```typescript
const url = `api/plugin-proxy/${meta.id}/yourRoutePath`;
```

:::note

The plugin ID is not your plugin name (for example, `myorg-plugin-app`) but the app ID. The app ID is part of the meta prop passed to the app plugin constructor. You can also get the plugin meta inside React with the hook `usePluginContext()`.

:::
