---
id: fetch-data-from-frontend-to-app
title: Fetch data from frontend code to app plugin using the data proxy
description: Learn how to use the data proxy API to fetch data from frontend code in app plugins in Grafana
keywords:
  - grafana
  - plugins
  - data proxy
  - frontend
  - app
  - app plugin
  - CORS
---

# Fetch data from app plugins

Along with the JavaScript [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), the Grafana data proxy is used to fetch data from a Grafana app plugin.

The data proxy is especially useful

- for overcoming cross-site (CORS) limitations, or
- for performing authenticated requests, or
- for sending other sensitive data from your plugin configuration to Grafana.

This guide explains how the data proxy works in app plugins and explores common issues in its usage. For usage related to data source plugins, refer to our [documentation](../data-source-plugins/fetch-data-from-frontend.md)

## How does it work?

Instead of performing a request directly from the browser to the server, you perform the request through the Grafana backend server, which handles it and returns the response to the plugin.

- **Without data proxy**: The requests go directly from the browser to the third-party server.
- **With data proxy**: The requests go from the browser to the Grafana backend and then to the third-party server. In this case, there are no restrictions in CORS, and you can instruct Grafana to send the request authenticated by using sensitive data stored in the plugin configuration.

:::note

You can only make use of the data proxy from data source and app plugins. _You can't use the data proxy from panel plugins._

:::

## Use the data proxy within an app plugin

The setup of routes in your app plugin's `plugin.json` metadata is the same as in [fetching data from a data source plugin](../data-source-plugins/fetch-data-from-frontend#step-1-declare-your-route-in-your-plugin-metadata).

That is, you first need to set up the routes in your `plugin.json` metadata:

```json title="src/plugin.json"
"routes": [
	{
	  "path": "myRoutePath",
	  "url": "{{ .JsonData.apiUrl }}"
	}
],
```

Notice that the `url` value contains an interpolation of `jsonData.apiUrl`. Your [configuration page](../data-source-plugins/fetch-data-from-frontend#step-2-create-your-configuration-page) must take care of setting the `apiUrl` in the `jsonData` object based on the user input.

:::note

You must build your plugin and restart the Grafana server every time you modify your `plugin.json` file.

:::

However, unlike in data source plugins, app plugins don't receive the URL as part of the props. Accordingly, the URL is constructed like this:

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

To learn about adding authentication to the data proxy for app plugins, refer to our [documentation](./add-authentication-for-app-plugins.md).

## Debug requests from the data proxy

If you want to debug the requests that are going from the Grafana backend to your API, enable the data proxy logging in the [configuration](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#dataproxy).

You must also [enable debug logs](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#mode) in Grafana to be able to see the data proxy logs in your Grafana configuration file. For example:

```
[log]
level = debug

[dataproxy]
logging = true
```

With this configuration, the Grafana server output shows the requests going out to your API from the data proxy.

## Send special headers using the data proxy

You can send special headers using the data proxy. To learn about adding headers to the data proxy, refer to our [documentation](./add-authentication-for-app-plugins.md).
