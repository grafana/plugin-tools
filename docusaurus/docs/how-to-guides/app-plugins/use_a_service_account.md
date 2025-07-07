---
id: use-a-service-account
title: Use service accounts in Grafana app plugins
description: How to use service accounts in Grafana app plugins to authenticate against the Grafana API.
keywords:
  - grafana
  - plugin
  - app
  - service
  - bundling
  - authentication
---

# Use service accounts in Grafana app plugins

App plugins with service accounts can authenticate against the Grafana API without requiring user intervention, allowing your plugin to access Grafana resources with specific permissions. Service accounts provide a secure way for your plugin to interact with Grafana's backend services and APIs.

Service accounts are managed automatically by Grafana when your plugin is registered. Unlike traditional authentication methods that might require user credentials or manual token generation.

## Before you begin

Ensure your development environment meets the following prerequisites:

- **Grafana version:** Use Grafana 10.3 or later
- **Feature toggle:** Enable the `externalServiceAccounts` feature toggle. Refer to our documentation [on configuring Grafana feature toggles](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#feature_toggles)
- **Config variable:** Enable the [auth.managed_service_accounts_enabled](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#managed_service_accounts_enabled) configuration variable. Refer to our documentation [on configuring Grafana](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#configure-grafana)
- **Deployment type:** This feature currently **only supports single-organization deployments**

## Add service account configuration

To configure your app plugin to use a service account, add an `iam` section to your `plugin.json` file:

```json title="plugin.json"
"iam": {
  "permissions": [
    { "action": "dashboards:create", "scope": "folders:uid:*" },
    { "action": "dashboards:read", "scope": "folders:uid:*"},
    { "action": "dashboards:write", "scope": "folders:uid:*"},
    { "action": "folders:read", "scope": "folders:uid:*"},
    { "action": "folders:write", "scope": "folders:uid:*"},
    { "action": "org.users:read", "scope": "users:*"},
    { "action": "teams:read", "scope": "teams:*"},
    { "action": "teams.permissions:read", "scope": "teams:*"}
  ]
}
```

The `permissions` array defines the specific actions and scopes the service account can access. Refer to the [Grafana access control documentation](https://grafana.com/docs/grafana/latest/administration/roles-and-permissions/access-control/) for available permissions.

## Retrieve the service account token

When your plugin starts, Grafana automatically creates a service account with the specified permissions and provides a token to your plugin. Retrieve this token from the request context:

```go title="plugin.go"
// Get the service account token from the plugin context
cfg := backend.GrafanaConfigFromContext(req.Context())
saToken, err := cfg.PluginAppClientSecret()
if err != nil {
  http.Error(w, err.Error(), http.StatusInternalServerError)
  return
}
```

## Use the token for API requests

### Option 1: Configure the HTTP client with the token

Set up your HTTP client to include the token in all requests:

```go title="plugin.go"
opts, err := settings.HTTPClientOptions(ctx)
if err != nil {
  return nil, fmt.Errorf("http client options: %w", err)
}

opts.Headers = map[string]string{"Authorization": "Bearer " + saToken}

// Client is now pre-configured with the bearer token
client, err := httpclient.New(opts)
if err != nil {
  return nil, fmt.Errorf("httpclient new: %w", err)
}
```

### Option 2: Add the token to individual requests

Alternatively, add the token to specific HTTP requests:

```go title="plugin.go"
req, err := http.NewRequest("GET", grafanaAPIURL, nil)
if err != nil {
  return nil, err
}
req.Header.Set("Authorization", "Bearer " + saToken)
```

## Example implementation

Here's a simple example of a resource handler that uses the service account token to proxy requests to the Grafana API:

```go title="plugin.go"
func (a *App) handleAPI(w http.ResponseWriter, req *http.Request) {
  // Get Grafana configuration from context
  cfg := backend.GrafanaConfigFromContext(req.Context())

  // Get the base Grafana URL
  grafanaAppURL, err := cfg.AppURL()
  if err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
    return
  }

  // Get the service account token
  saToken, err := cfg.PluginAppClientSecret()
  if err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
    return
  }

  // Create a request to the Grafana API
  reqURL, err := url.JoinPath(grafanaAppURL, req.URL.Path)
  proxyReq, err := http.NewRequest("GET", reqURL, nil)

  // Add the token to the request
  proxyReq.Header.Set("Authorization", "Bearer " + saToken)

  // Make the request
  res, err := a.httpClient.Do(proxyReq)
  // Handle response...
}
```

## Limitations

- The service account is automatically created in the default organization (ID: `1`)
- The plugin can only access data and resources within that specific organization
- If your plugin needs to work with multiple organizations, this feature is not suitable

## Security considerations

- The service account cannot be modified or deleted by users
- The token provides access to Grafana resources based on the permissions defined in your plugin
- Do not expose the service account token to the frontend or end users

## Learn more

- [Grafana service accounts documentation](https://grafana.com/docs/grafana/latest/administration/service-accounts/)
- [Grafana access control documentation](https://grafana.com/docs/grafana/latest/administration/roles-and-permissions/access-control/)
- [Grafana plugin.json reference](https://grafana.com/developers/plugin-tools/reference-plugin-json)
