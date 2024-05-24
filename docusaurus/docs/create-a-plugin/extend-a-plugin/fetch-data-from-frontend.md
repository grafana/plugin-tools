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

- **Without data proxy**: The requests go directly from the browser to the third-party server.
- **With data proxy**: The requests go from the browser to the Grafana backend and then to the third-party server. In this case, there are no restrictions in CORS, and you can instruct Grafana to send the request authenticated by using sensitive data stored in the plugin configuration.

:::note
You can only make use of the data proxy from data source and app plugins. _You can't use the data proxy from panel plugins._
:::

## How to use the data proxy in data source plugins

The easiest way to use the data proxy from a datasource plugin is using the [`DataSourceHttpSettings`](https://developers.grafana.com/ui/latest/index.html?path=/docs/data-source-datasourcehttpsettings--docs) component.

### Step 1: Use the `DataSourceHttpSettings` component in your data source plugin configuration page

```typescript title="src/ConfigEditor.tsx"
import React from 'react';
import { DataSourceHttpSettings } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';

export function ConfigEditor(props: DataSourcePluginOptionsEditorProps) {
  const { onOptionsChange, options } = props;

  return (
    <DataSourceHttpSettings
      defaultUrl="https://jsonplaceholder.typicode.com/"
      dataSourceConfig={options}
      onChange={onOptionsChange}
    />
  );
}
```

The `DataSourceHttpSettings` will display a form with all the options for the user to configure an HTTP endpoint, including authentication, TLS, cookies, and timeout.

### Step 2: Use the data proxy in your data source plugin

Once the user has entered the endpoint details in the data source configuration page, you can query the data proxy URL that is passed in the data source instance settings (`DataSourceInstanceSettings.url`).

```typescript title="src/dataSource.ts"
import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  FieldType,
  PartialDataFrame,
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
      // You can see above that `this.baseUrl` is set in the constructor
      // in this example we assume the configured url is
      // https://jsonplaceholder.typicode.com
      /// if you inspect `this.baseUrl` you'll see the Grafana data proxy url
      url: `${this.baseUrl}/todos`,
    });
    // backendSrv fetch returns an observable object
    // we should unwrap with rxjs
    const responseData = await lastValueFrom(response);
    const todos = responseData.data;

    // we'll return the same todos for all queries in this example
    // in a real data source each target should fetch the data
    // as necessary.
    const data: PartialDataFrame[] = options.targets.map((target) => {
      return {
        refId: target.refId,
        fields: [
          { name: 'Id', type: FieldType.number, values: todos.map((todo) => todo.id) },
          { name: 'Title', type: FieldType.string, values: todos.map((todo) => todo.title) },
        ],
      };
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

:: note
The user must first configure the data source in the configuration page before the data source can query
the endpoint via the data source. If the data source is not configured, the data proxy won't know which
endpoint to send the request to.
::

## How to use the data proxy in data source plugins with a custom configuration page

If you don't want to use the `DataSourceHttpSettings` component and instead create your own configuration page
you will have to do some additonal setup in your plugin.

### Step 1: Declare your route in your plugin metadata

You first need to set up the routes in your `plugin.json` metadata.

```json title="src/plugin.json"
"routes": [
	{
	  "path": "myRoutePath",
	  "url": "{{ .JsonData.apiUrl }}"
	}
],
```

Notice that the `url` value contains an interpolation of `jsonData.apiUrl`. Your configuration page must take care of setting the `apiUrl` in the `jsonData` object based on the user input.

:::note
You must build your plugin and restart the Grafana server every time you modify your `plugin.json` file.
:::

### Step 2: Create your configuration page

```typescript title="src/ConfigEditor.tsx"
import React, { ChangeEvent } from 'react';
import { InlineField, Input } from '@grafana/ui';

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
    {/* The rest of your configuration page form */}
  );
}
```

### Step 3: Fetch data from your frontend code

In your data source plugin, you can now fetch data by using the proxy URL.

Refer to the [previous example](#step-2-create-your-configuration-page), as the code is the same.

## Use the data proxy within an app plugin

The setup of routes in your `plugin.json` metadata remains the same as in a data source plugin. However, since app plugins don't receive the URL as part of the props, the URL is constructed like this:

```typescript
const dataProxyUrl = `api/plugin-proxy/${PLUGIN_ID}/yourRoutePath`;
```

Here is an example of a function that fetches data from the data proxy in an app plugin:

Declare the route in `src/plugin.json`. You may also use authenticated requests and `jsonData` interpolation like in data source plugins.

```json title="src/plugin.json"
"routes": [
{
        "path": "myRoutePath",
        "url": "https://api.example.com",
        // jsonData interpolation is also possible
        //"url": "{{ .JsonData.apiUrl }}",
}]
```

In your app plugin's code, you can then fetch data using the data proxy by constructing the data proxy URL like this:

```typescript title="src/dataproxy-api-example.ts"
import { getBackendSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

async function getDataFromApi() {
  const dataProxyUrl = `api/plugin-proxy/${PLUGIN_ID}/myRoutePath`;
  const response = getBackendSrv().fetch<TODO[]>({
    url: dataProxyUrl,
  });
  return await lastValueFrom(response);
}
```

## Use other HTTP methods (for example, POST, PUT, DELETE) with the data proxy

You can specify the method directly in the `fetch` method. Your routes in `src/plugin.json` remain the same:

```typescript
const response = getBackendSrv().fetch<TODO[]>({
  url: `${this.baseUrl}`,
  method: 'POST',
  data: dataToSendViaPost,
});
```

## Add authentication to your requests using the data proxy

To learn about adding authentication to the data proxy, refer to our [documentation](./add-authentication-for-data-source-plugins.md).

## Debug requests from the data proxy

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

## Send special headers using the data proxy

You can send special headers using the data proxy. To learn about adding headers to the data proxy, refer to our [documentation](./add-authentication-for-data-source-plugins.md).
