---
id: add-authentication-for-app-plugins
title: Add authentication for app plugins
description: How to add authentication to app plugin requests
keywords:
  - grafana
  - plugins
  - plugin
  - authentication
  - app
  - apps
---

import CreatePlugin from '@shared/create-plugin-backend.md';

Grafana app plugins allow you bundle panels and data sources. Apps also allow you to create custom pages in Grafana with complex functionality.

## Choose an authentication method

There are two ways to add authentication to an app plugin. Configure your app plugin to authenticate against a third-party API in one of either of two ways:

- Use the [data source proxy](#authenticate-using-the-data-source-proxy) method.
- Build a [plugin with a backend component](#authenticate-using-a-backend-component).

| Case                                                                                            | Use                        |
| ----------------------------------------------------------------------------------------------- | -------------------------- |
| Do you need to authenticate your plugin using Basic Auth or API keys?                           | Use the data source proxy. |
| Does your API use a custom authentication method that isn't supported by the data source proxy? | Use a backend component.   |
| Does your API communicate over a protocol other than HTTP?                                      | Use a backend component.   |

## Encrypt secrets configuration

App plugins have two ways of storing custom configuration:

- `jsonData`
- `secureJsonFields`

:::warning

Do not use `jsonData` with sensitive data such as passwords, tokens, and API keys. If you need to store sensitive information, use `secureJsonData` instead.

:::

### Store configuration in `secureJsonData`

If you need to store sensitive information (secrets), use `secureJsonData` instead of `jsonData`. Whenever the user saves the app configuration, the secrets in `secureJsonData` are sent to the Grafana server and they're encrypted before they're stored.

Once you have encrypted the secure configuration, the configuration can no longer be accessed from the browser. The only way to access secrets after they've been saved is by using the [_data source proxy_](#authenticate-using-the-data-source-proxy) or through a [backend component](#authenticate-using-a-backend-component).

### Add secrets configuration to your app plugin

Your bootstrapped app plugin should have an `AppConfig` component that allows the user to configure the app. This component contains example code to store an `apiKey` in `secureJsonData`. You can check the properties of `secureJsonData` in `secureJsonFields`, which is part of `plugin.meta`. The `secureJsonFields` object contains the keys that have been configured by the user.

Here are some code highlights:

1. The `secureJsonData` never comes with populated values regardless of whether the user has configured it or not. Instead, you can determine if a property has been configured by checking if the key is `true` inside `secureJsonFields`. For example:

   ```ts
   const { jsonData, secureJsonFields } = plugin.meta;
   const [state, setState] = useState<State>({
     apiUrl: jsonData?.apiUrl || '',
     apiKey: '',
     // check if the key is true or false to determine if it has been configured
     isApiKeySet: Boolean(secureJsonFields?.apiKey),
   });
   ```

1. You can update `secureJsonData` by sending a POST to the `/api/plugins/<pluginId>/settings` endpoint.

   If you are setting keys in `secureJsonData`, then you should only send the keys with values modified by the user. Sending any value (including empty strings) overwrites the existing configuration.

   ```ts
   const secureJsonData = apiKey.length > 0 ? { apiKey } : undefined;
   await getBackendSrv().fetch({
     url: `/api/plugins/${pluginId}/settings`,
     method: 'POST',
     data: {
       secureJsonData,
     },
   });
   ```

## Authenticate using the data source proxy

Once the user has saved the configuration for your app, the secrets configuration becomes unavailable in the browser. Encrypted secrets can only be accessed on the server. So how do you add them to your request?

The Grafana server comes with a proxy that lets you define templates for your requests: _proxy routes_. Grafana sends the proxy route to the server, decrypts the secrets along with other configuration, and adds them to the request before sending it.

:::note

Be sure not to confuse the data proxy with the [auth proxy](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/configure-authentication/auth-proxy). The data proxy is used to authenticate a plugin request, while the auth proxy is used to log into Grafana itself.

:::

### Add a proxy route to your plugin

To forward requests through the data proxy, you need to configure one or more _proxy routes_. A proxy route is a template for any outgoing request that is handled by the proxy. You can configure proxy routes in the [plugin.json](../../reference/metadata.md) file.

1. Add the route to `plugin.json`:

   ```json title="src/plugin.json"
   "routes": [
     {
       "path": "myRoutePath",
       "url": "https://api.example.com"
     }
   ]
   ```

   :::note

   You need to build your plugin and restart the Grafana server every time you make a change to your `plugin.json` file.

   :::

1. In your app plugin, fetch data from the proxy route using the `getBackendSrv` function from the `@grafana/runtime` package:

   ```ts
   import { getBackendSrv } from '@grafana/runtime';
   import { lastValueFrom } from 'rxjs';

   async function getDataFromApi() {
     const dataProxyUrl = `api/plugin-proxy/${PLUGIN_ID}/myRoutePath`;
     const response = getBackendSrv().fetch({
       url: dataProxyUrl,
     });
     return await lastValueFrom(response);
   }
   ```

### Add a dynamic proxy route to your plugin

After Grafana sends the data proxy requests to the server, the data source proxy decrypts the sensitive data. The data source proxy then interpolates the template variables with the decrypted data before making the request.

To add user-defined configuration to your routes:

- Use `.JsonData` for configuration stored in `jsonData`. For example, where `projectId` is the name of a property in the `jsonData` object:

  ```json title="src/plugin.json"
  "routes": [
    {
      "path": "example",
      "url": "https://api.example.com/projects/{{ .JsonData.projectId }}"
    }
  ]
  ```

- Use `.SecureJsonData` for sensitive data stored in `secureJsonData`. For example, use `.SecureJsonData` where `password` is the name of a property in the `secureJsonData` object:

  ```json title="src/plugin.json"
  "routes": [
    {
      "path": "example",
      "url": "https://{{ .JsonData.username }}:{{ .SecureJsonData.password }}@api.example.com"
    }
  ]
  ```

In addition to adding the URL to the proxy route, you can also add headers, URL parameters, and a request body.

#### Add HTTP headers to a proxy route

Here's an example of adding `name` and `content` as HTTP headers:

```json title="src/plugin.json"
"routes": [
  {
    "path": "example",
    "url": "https://api.example.com",
    "headers": [
      {
        "name": "Authorization",
        "content": "Bearer {{ .SecureJsonData.apiToken }}"
      }
    ]
  }
]
```

#### Add a request body to a proxy route

Here's an example of adding `username` and `password` to the request body:

```json title="src/plugin.json"
"routes": [
  {
    "path": "example",
    "url": "http://api.example.com",
    "body": {
      "username": "{{ .JsonData.username }}",
      "password": "{{ .SecureJsonData.password }}"
    }
  }
]
```

#### Limitations of the data proxy in app plugins

- `urlParams` configuration is not supported in app plugins.
- `tokenAuth` configuration is not supported in app plugins (for OAuth 2.0).

## Authenticate using a backend component

While the data proxy supports the most common authentication methods for HTTP APIs, there are some limitations to using proxy routes:

- Proxy routes only support HTTP or HTTPS.
- Proxy routes don't support custom token authentication.
- Proxy routes for apps don't support `urlParams`.
- Proxy routes for apps don't support `tokenAuth`.

If any of these limitations apply to your plugin, you need to add a backend component to your plugin.. Because backend components are run on the server, they can access decrypted secrets, which makes it easier to implement custom authentication methods.

### Access secrets in the backend component

The decrypted secrets are available from the `DecryptedSecureJSONData` field in the app instance settings.

```go
func (a *App) registerRoutes(mux *http.ServeMux) {
        // ... other routes
	mux.HandleFunc("/test", a.handleMyRequest)
}

func (a *App) handleMyRequest(w http.ResponseWriter, req *http.Request) {
	pluginConfig := backend.PluginConfigFromContext(req.Context())
	secureJsonData := pluginConfig.AppInstanceSettings.DecryptedSecureJSONData

        // Use the decrypted data

	w.Header().Add("Content-Type", "application/json")
	if _, err := w.Write([]byte(`{"message": "ok}`)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
```

### Work with cookies

Your app plugin can read the cookies forwarded by Grafana to the app.

```go
func (a *App) handleMyRequest(w http.ResponseWriter, req *http.Request) {

	cookies := req.Cookies()

        // loop through cookies as an example
	for _, cookie := range cookies {
		log.Printf("cookie: %+v", cookie)
	}
        // Use the cookies

	w.Header().Add("Content-Type", "application/json")
	if _, err := w.Write([]byte(`{"message": "ok}`)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
```

### Forward the user header for the logged-in user

When [`send_user_header`](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#send_user_header) is enabled, Grafana passes the user header to the plugin using the `X-Grafana-User` header.
