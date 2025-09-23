---
id: implement-rbac-in-app-plugins
title: Implement RBAC in app plugins
description: How to add role-based access control (RBAC) to Grafana app plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - advanced
  - apps
  - app plugins
  - rbac
  - roles
  - access control
---

Role-based access control (RBAC) in Grafana app plugins is essential for creating secure and tailored user experiences. By implementing RBAC, you ensure that sensitive functionalities and data are only accessible to users with appropriate permissions, enhancing both security and usability. Proper configuration is crucial as misconfigurations can lead to security vulnerabilities.

For more on how RBAC works and each role visit the [official docs](https://grafana.com/docs/grafana/latest/administration/roles-and-permissions/access-control/rbac-for-app-plugins/).

## Before you begin

Requires Grafana version 11.6.0 or later.

## Defining roles

To establish roles for your plugin, insert a `roles` section into your `plugin.json` file. For example:

```json
"roles": [
  {
    "role": {
      "name": "Patents Reader",
      "description": "Read patents",
      "permissions": [
        {"action": "grafana-appwithrbac-app.patents:read"}
      ]
    },
    "grants": ["Admin"] // Automatically grants this role to users with the Admin role.
  },
  {
    "role": {
      "name": "Research Papers Reader",
      "description": "Read research papers",
      "permissions": [
        {"action": "grafana-appwithrbac-app.papers:read"}
      ]
    },
    "grants": ["Viewer"] // Automatically grants this role to users with the Viewer role.
  }
]
```

In the `roles` array, each role object specifies `name` and `description` for clarity and governance, while `permissions` define the exact actions the role can perform, such as `read` or `write`. The `grants` array determines which default user roles, like `Admin` or `Viewer`, should automatically receive these custom roles.

For example, in the above example, users with the `Viewer` role will automatically be granted the `Research Papers Reader` role.

When defining roles, ensure each role is clearly differentiated with unique permissions to avoid conflicts and unintended access. It's best to follow the principle of least privilege, assigning the minimum permissions necessary for the tasks.

## Secure frontend includes

To enforce action-based access control on your frontend pages, incorporate the `action` parameter into the include definitions in your `plugin.json` file. Here is how you can apply it:

```json
"includes": [
  {
    "type": "page",
    "name": "Research documents",
    "path": "/a/%PLUGIN_ID%/research-docs",
    "action": "grafana-appwithrbac-app.papers:read",
    "addToNav": true,
    "defaultNav": false
    // This page will only appear for users with the 'papers:read' permission
  },
  {
    "type": "page",
    "name": "Patents",
    "path": "/a/%PLUGIN_ID%/patents",
    "action": "grafana-appwithrbac-app.patents:read",
    "addToNav": true,
    "defaultNav": false
    // This page will only appear for users with the 'patents:read' permission
  }
]
```

## Secure proxied routes

To safeguard your proxied routes with action checks, include the `reqAction` parameter in your route definitions within the `plugin.json` file. Here’s an example of how to do this:

```json
"routes": [
  {
    "path": "api/external/patents",
    "method": "*",
    "reqAction": "grafana-appwithrbac-app.patents:read",
    "url": "{{ .JsonData.backendUrl }}/api/external/patents",
    "headers": [
      {
        "name": "Authorization",
        "content": "{{ .SecureJsonData.backendApiToken }}"
      }
    ]
  }
]
```

## Secure backend resources

If your backend exposes resources, you can secure them with action-based checks.

To enable this protection, activate the `externalServiceAccounts` feature. This allows the use of managed service accounts to access Grafana user permissions.

:::note

The `externalServiceAccounts` feature only supports single organization setups.
It can be enabled in your Grafana instance by modifying the `docker-compose.yaml` file as follows:

```yaml
environment:
  - GF_FEATURE_TOGGLES_ENABLE=externalServiceAccounts
```

:::

The backend service account and ID forwarding setup allow your plugin's backend to authenticate requests and ascertain the user's identity and permissions reliably. This setup is essential for maintaining secure and controlled access to backend resources.

In your `plugin.json`, add the `iam` section to get a service account token with the needed permissions:

```json
"iam": {
  "permissions": [
    {"action": "users.permissions:read", "scope": "users:*"}
  ]
}
```

## Action sets, folder access levels with permissions

The action set system provides a way for plugins to extend Grafana's View, Edit or Admin access to a folder.

Note:

- **Folder Only**: Restricted to `folders:view/edit/admin` action sets
- **Already Scoped**: The permission will be scoped to a particular folder once a user gets View/Edit/Admin access to the folder.
- **Append Only**: Action sets can only be extended, not modified or restricted

Extending anything other than the action sets results in an error.
```bash
logger=plugins.actionsets.registration pluginId=grafana-lokiexplore-app error="[accesscontrol.actionSetInvalid] 
currently only folder and dashboard action sets are supported, provided action set grafana-lokiexplore-app:view is not a folder or dashboard action set"
```

### Grafana Action Sets

Grafana has several action sets for folders that can be extended:

**Folder Action Sets:**
- `folders:view` → `["folders:read", "dashboards:read"]`
- `folders:edit` → `["folders:read", "folders:write", "dashboards:read", "dashboards:write", "folders:create"]`
- `folders:admin` → `["folders:read", "folders:write", "folders:delete", "folders.permissions:read", "folders.permissions:write", ...]`

### Codepaths
[RegistrationsOfActionSets](https://github.com/grafana/grafana/blob/main/pkg/services/accesscontrol/resourcepermissions/service.go#L574
)

### Plugin Action Sets Definition

Plugins can define action sets in their `plugin.json`:

```json
{
  "id": "my-plugin",
  "type": "app", 
  "actionSets": [
    {
      "action": "folders:edit",
      "actions": [
        "my-plugin.documents:create",
        "my-plugin.documents:update", 
        "my-plugin.templates:write"
      ]
    },
    {
      "action": "folders:admin", 
      "actions": [
        "my-plugin.settings:write",
        "my-plugin.users:manage",
        "my-plugin.permissions:write"
      ]
    }
  ]
}
```

### Practical Example

**With Action Sets (extending existing sets):**
```json
{
  "actionSets": [
    {
      "action": "folders:edit",
      "actions": [
        "my-plugin.docs:create",
        "my-plugin.docs:edit"
      ]
    }
  ],
  ...
}
```

**Result:** When a user is granted Edit access to a folder, they get:
- All original `folders:edit` actions (folders:read, folders:write, folders:create)
- Plus the plugin's additional actions (my-plugin.docs:create, my-plugin.docs:edit)

## Implementation

Next, integrate the `authlib/authz` library into your plugin's backend code to manage authorization effectively:

```go
import "github.com/grafana/authlib/authz"
```

To set up the authorization client, start by retrieving the client secret from the plugin context of the incoming request. Since the client secret remains constant, you only need to initialize the authorization client once. This approach utilizes the client cache efficiently.

Use the following function to obtain the authorization client:

```go
// GetAuthZClient returns an authz enforcement client configured thanks to the plugin context.
func (a *App) GetAuthZClient(req *http.Request) (authz.EnforcementClient, error) {
	ctx := req.Context()
	ctxLogger := log.DefaultLogger.FromContext(ctx)
	cfg := backend.GrafanaConfigFromContext(ctx)

	saToken, err := cfg.PluginAppClientSecret()
	if err != nil || saToken == "" {
		if err == nil {
			err = errors.New("service account token not found")
		}
		ctxLogger.Error("Service account token not found", "error", err)
		return nil, err
	}

	// Prevent two concurrent calls from updating the client
	a.mx.Lock()
	defer a.mx.Unlock()

	if saToken == a.saToken {
		ctxLogger.Debug("Token unchanged returning existing client")
		return a.authzClient, nil
	}

	grafanaURL, err := cfg.AppURL()
	if err != nil {
		ctxLogger.Error("App URL not found", "error", err)
		return nil, err
	}

	// Initialize the authorization client
	client, err := authz.NewEnforcementClient(authz.Config{
		APIURL: grafanaURL,
		Token:  saToken,
		// Grafana is signing the JWTs on local setups
		JWKsURL: strings.TrimRight(grafanaURL, "/") + "/api/signing-keys/keys",
	},
		// Fetch all user permissions prefixed with grafana-appwithrbac-app
		authz.WithSearchByPrefix("grafana-appwithrbac-app"),
		// Use a cache with a lower expiry time
		authz.WithCache(cache.NewLocalCache(cache.Config{
			Expiry:          10 * time.Second,
			CleanupInterval: 5 * time.Second,
		})),
	)
	if err != nil {
		ctxLogger.Error("Initializing authz client", "error", err)
		return nil, err
	}

	a.saToken = saToken
	a.authzClient = client

	return client, nil
}
```

:::note

The `WithSearchByPrefix` option is used to minimize frequent queries to the authorization server by filtering actions based on their prefix.

The `WithCache` option enables customization of the library's internal cache, allowing you to specify alternative cache settings. By default, the cache expires after 5 minutes.

:::

Following this setup, you can implement access control using the client. For example:

```go
func (a *App) HasAccess(req *http.Request, action string) (bool, error) {
	// Retrieve the ID token
	idToken := req.Header.Get("X-Grafana-Id")
	if idToken == "" {
		return false, errors.New("id token not found")
	}

	authzClient, err := a.GetAuthZClient(req)
	if err != nil {
		return false, err
	}

	// Check user access
	hasAccess, err := authzClient.HasAccess(req.Context(), idToken, action)
	if err != nil || !hasAccess {
		return false, err
	}
	return true, nil
}
```

Use function within a `Resources` endpoint to conduct an access control check and verify the user possesses the necessary permissions to access the specified resource.

```go
if hasAccess, err := a.HasAccess(req, "grafana-appwithrbac-app.patents:read"); err != nil || !hasAccess {
  if err != nil {
    log.DefaultLogger.FromContext(req.Context()).Error("Error checking access", "error", err)
  }
  http.Error(w, "permission denied", http.StatusForbidden)
  return
}
```

## Implement frontend access control checks

Implement frontend access checks to prevent unauthorized users from navigating to restricted UI sections, and ensure a consistent and secure user experience that aligns with backend permissions.

To prevent a broken UI, it is crucial to implement these checks by only registering routes and displaying links based on users' permissions. This proactive approach ensures that the user interface reflects the security policies defined by the backend, providing a seamless and secure user experience.

To perform access control checks, import the `hasPermission` function from the Grafana runtime package.

```ts
import { hasPermission } from '@grafana/runtime';
```

Then checks can be performed as follow:

```ts
if (hasPermission('grafana-appwithrbac-app.papers:read')) {
  // Examples: register route, display link, and so on
}
```

## Assigning roles

You can assign roles within Grafana by navigating to the user management section, where you can assign custom roles to users based on their responsibilities. Detailed steps can be found in our comprehensive [role management guide](https://grafana.com/docs/grafana/latest/administration/roles-and-permissions/).

Assigning roles to specific users requires either Grafana Cloud or a [Grafana Enterprise license](https://grafana.com/docs/grafana/latest/administration/roles-and-permissions/access-control/#role-based-access-control-rbac).

If you have a Grafana Enterprise license, then you can edit the `docker-compose.yaml` file as follows:

```yaml
environment:
  - GF_ENTERPRISE_LICENSE_TEXT=<your license>
```
