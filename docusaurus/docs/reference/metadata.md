---
id: plugin-json
title: Metadata (plugin.json)
description: Reference for the Grafana plugin.json metadata file.
keywords:
  - grafana
  - plugins
  - documentation
  - plugin.json
  - API reference
  - API
sidebar_position: 10
---

# Plugin metadata (plugin.json)

The `plugin.json` file is required for all plugins. When Grafana starts, it scans the plugin folders and mounts every folder that contains a `plugin.json` file unless the folder contains a subfolder named `dist`. In that case, Grafana mounts the `dist` folder instead.

## Properties

| Property             | Type                          | Required | Description                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------- | ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                 | string                        | **Yes**  | Unique name of the plugin. If the plugin is published on grafana.com, then the plugin `id` should follow the Grafana naming convention.                                                                                                                                                                                                                                                                 |
| `name`               | string                        | **Yes**  | Human-readable name of the plugin that is shown to the user in the UI.                                                                                                                                                                                                                                                                                                                                  |
| `type`               | string                        | **Yes**  | Plugin type. Possible values are: `app`, `datasource`, `panel`, `renderer`, `secretsmanager`.                                                                                                                                                                                                                                                                                                           |
| `info`               | [object](#info)               | **Yes**  | Metadata for the plugin. Some fields are used on the plugins page in Grafana and others on grafana.com if the plugin is published.                                                                                                                                                                                                                                                                      |
| `dependencies`       | [object](#dependencies)       | **Yes**  | Dependency information related to Grafana and other plugins.                                                                                                                                                                                                                                                                                                                                            |
| `$schema`            | string                        | No       | Schema definition for the plugin.json file. Used primarily for schema validation.                                                                                                                                                                                                                                                                                                                       |
| `alerting`           | boolean                       | No       | For data source plugins, if the plugin supports alerting. Requires `backend` to be set to `true`.                                                                                                                                                                                                                                                                                                       |
| `annotations`        | boolean                       | No       | For data source plugins, if the plugin supports annotation queries.                                                                                                                                                                                                                                                                                                                                     |
| `autoEnabled`        | boolean                       | No       | Set to true for app plugins that should be enabled and pinned to the navigation bar in all orgs.                                                                                                                                                                                                                                                                                                        |
| `backend`            | boolean                       | No       | If the plugin has a backend component.                                                                                                                                                                                                                                                                                                                                                                  |
| `category`           | string                        | No       | Plugin category used on the "Add data source" page. Possible values are: `tsdb`, `logging`, `cloud`, `tracing`, `profiling`, `sql`, `enterprise`, `iot`, `other`.                                                                                                                                                                                                                                       |
| `enterpriseFeatures` | [object](#enterprisefeatures) | No       | Grafana Enterprise specific features                                                                                                                                                                                                                                                                                                                                                                    |
| `executable`         | string                        | No       | The first part of the file name of the backend component executable. There can be multiple executables built for different operating system and architecture. Grafana will check for executables named `<executable>_<$GOOS>_<lower case $GOARCH><.exe for Windows>`, e.g. `plugin_linux_amd64`. Combination of $GOOS and $GOARCH can be found here: https://golang.org/doc/install/source#environment. |
| `iam`                | [object](#iam)                | No       | Initialize a service account for the plugin, with a tailored set of RBAC permissions.                                                                                                                                                                                                                                                                                                                   |
| `includes`           | [object](#includes)[]         | No       | Resources to include in plugin.                                                                                                                                                                                                                                                                                                                                                                         |
| `logs`               | boolean                       | No       | For data source plugins, if the plugin supports logs. It may be used to filter logs only features.                                                                                                                                                                                                                                                                                                      |
| `metrics`            | boolean                       | No       | For data source plugins, if the plugin supports metric queries. Used to enable the plugin in the panel editor.                                                                                                                                                                                                                                                                                          |
| `preload`            | boolean                       | No       | Initialize plugin on startup. By default, the plugin initializes on first use, but when preload is set to true the plugin loads when the Grafana web app loads the first time. Only applicable to app plugins.                                                                                                                                                                                          |
| `queryOptions`       | [object](#queryoptions)       | No       | For data source plugins. There is a query options section in the plugin's query editor and these options can be turned on if needed.                                                                                                                                                                                                                                                                    |
| `roles`              | [object](#roles)[]            | No       | List of RBAC roles and their default assignments.                                                                                                                                                                                                                                                                                                                                                       |
| `routes`             | [object](#routes)[]           | No       | For data source plugins. Proxy routes used for plugin authentication and adding headers to HTTP requests made by the plugin. For more information, refer to [Authentication for data source plugins](https://grafana.com/developers/docs/create-a-plugin/extend-a-plugin/add-authentication-for-data-source-plugins.md).                                                                                |
| `skipDataQuery`      | boolean                       | No       | For panel plugins. Hides the query editor.                                                                                                                                                                                                                                                                                                                                                              |
| `state`              | string                        | No       | Marks a plugin as a pre-release. Possible values are: `alpha`, `beta`.                                                                                                                                                                                                                                                                                                                                  |
| `streaming`          | boolean                       | No       | For data source plugins, if the plugin supports streaming. Used in Explore to start live streaming.                                                                                                                                                                                                                                                                                                     |
| `tracing`            | boolean                       | No       | For data source plugins, if the plugin supports tracing. Used for example to link logs (e.g. Loki logs) with tracing plugins.                                                                                                                                                                                                                                                                           |
| `generated`          | [object](#generated)          | No       | **Shouldn't be edited manually.** This property is automatically generated by our build configuration using the `@grafana/plugin-meta-extractor` package. The property should only be present in the build output (`dist/plugin.json`).                                                                                                                                                                 |

## dependencies

Dependencies needed by the plugin.

### Properties

| Property            | Type                 | Required | Description                                                                                                                   |
| ------------------- | -------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `grafanaDependency` | string               | **Yes**  | Required Grafana version for this plugin. Validated using https://github.com/npm/node-semver.                                 |
| `grafanaVersion`    | string               | No       | (Deprecated) Required Grafana version for this plugin, e.g. `6.x.x 7.x.x` to denote plugin requires Grafana v6.x.x or v7.x.x. |
| `plugins`           | [object](#plugins)[] | No       | An array of required plugins on which this plugin depends.                                                                    |

### plugins

Plugin dependency. Used to display information about plugin dependencies in the Grafana UI.

#### Properties

| Property  | Type   | Required | Description                                                                                                                                   |
| --------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`      | string | **Yes**  |                                                                                                                                               |
| `name`    | string | **Yes**  |                                                                                                                                               |
| `type`    | string | **Yes**  | Possible values are: `app`, `datasource`, `panel`.                                                                                            |
| `version` | string | **Yes**  | We suggest using [SemVer](https://semver.org/) for your plugin versioning to alert users about potential changes, new features, or bug fixes. |

## enterpriseFeatures

Grafana Enterprise specific features.

### Properties

| Property                  | Type    | Required | Description                                                         |
| ------------------------- | ------- | -------- | ------------------------------------------------------------------- |
| `healthDiagnosticsErrors` | boolean | No       | Enable/Disable health diagnostics errors. Requires Grafana >=7.5.5. |

## iam

Grafana reads the Identity and Access Management section and initializes a service account for the plugin, with a tailored set of
[Grafana RBAC permissions](https://grafana.com/docs/grafana/latest/administration/roles-and-permissions/access-control/custom-role-actions-scopes/#rbac-permissions-actions-and-scopes).
Grafana will share the service account's bearer token with the plugin backend using the `GF_PLUGIN_APP_CLIENT_SECRET` environment variable.

Requires Grafana version 10.3.0 or later. Currently, this is behind the `externalServiceAccounts` feature toggle.

To try this feature out, follow this [example](https://github.com/grafana/grafana-plugin-examples/blob/main/examples/app-with-service-account/README.md).

### Properties

| Property      | Type                     | Required | Description                                 |
| ------------- | ------------------------ | -------- | ------------------------------------------- |
| `permissions` | [object](#permissions)[] | No       | Required RBAC permissions to query Grafana. |

### permissions

#### Properties

| Property | Type   | Required | Description                        |
| -------- | ------ | -------- | ---------------------------------- |
| `action` | string | **Yes**  | Action, for example: `teams:read`. |
| `scope`  | string | No       | Scope, e.g: `teams:*`.             |

## includes

### Properties

| Property     | Type    | Required | Description                                                                                                                                                                                     |
| ------------ | ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`     | string  | No       | The RBAC action a user must have to see this page in the navigation menu.                                                                                                                       |
| `addToNav`   | boolean | No       | Add the include to the side menu.                                                                                                                                                               |
| `component`  | string  | No       | (Legacy) The Angular component to use for a page.                                                                                                                                               |
| `defaultNav` | boolean | No       | Page or dashboard when user clicks the icon in the side menu.                                                                                                                                   |
| `icon`       | string  | No       | Icon to use in the side menu. For information on available icon, refer to [Icons Overview](https://developers.grafana.com/ui/latest/index.html?path=/story/docs-overview-icon--icons-overview). |
| `name`       | string  | No       |                                                                                                                                                                                                 |
| `path`       | string  | No       | Used for app plugins.                                                                                                                                                                           |
| `role`       | string  | No       | Possible values are: `Admin`, `Editor`, `Viewer`.                                                                                                                                               |
| `type`       | string  | No       | Possible values are: `dashboard`, `page`, `panel`, `datasource`.                                                                                                                                |
| `uid`        | string  | No       | Unique identifier of the included resource                                                                                                                                                      |

## info

Metadata for the plugin. Some fields are used on the plugins page in Grafana and others on grafana.com if the plugin is published.

### Properties

| Property      | Type                     | Required | Description                                                                                                                   |
| ------------- | ------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `keywords`    | string[]                 | **Yes**  | Array of plugin keywords. Used for search on grafana.com.                                                                     |
| `logos`       | [object](#logos)         | **Yes**  | SVG images that are used as plugin icons.                                                                                     |
| `updated`     | string                   | **Yes**  | Date when this plugin was built.                                                                                              |
| `version`     | string                   | **Yes**  | Project version of this commit, e.g. `6.7.x`.                                                                                 |
| `author`      | [object](#author)        | No       | Information about the plugin author.                                                                                          |
| `build`       | [object](#build)         | No       | Build information                                                                                                             |
| `description` | string                   | No       | Description of plugin. Used on the plugins page in Grafana and for search on grafana.com.                                     |
| `links`       | [object](#links)[]       | No       | An array of link objects to be displayed on this plugin's project page in the form `{name: 'foo', url: 'http://example.com'}` |
| `screenshots` | [object](#screenshots)[] | No       | An array of screenshot objects in the form `{name: 'bar', path: 'img/screenshot.png'}`                                        |

### author

Information about the plugin author.

#### Properties

| Property | Type   | Required | Description               |
| -------- | ------ | -------- | ------------------------- |
| `email`  | string | No       | Author's name.            |
| `name`   | string | No       | Author's name.            |
| `url`    | string | No       | Link to author's website. |

### build

Build information

#### Properties

| Property | Type   | Required | Description                                          |
| -------- | ------ | -------- | ---------------------------------------------------- |
| `branch` | string | No       | Git branch the plugin was built from.                |
| `hash`   | string | No       | Git hash of the commit the plugin was built from     |
| `number` | number | No       |                                                      |
| `pr`     | number | No       | GitHub pull request the plugin was built from        |
| `repo`   | string | No       |                                                      |
| `time`   | number | No       | Time when the plugin was built, as a Unix timestamp. |

### links

#### Properties

| Property | Type   | Required | Description |
| -------- | ------ | -------- | ----------- |
| `name`   | string | No       |             |
| `url`    | string | No       |             |

### logos

SVG images that are used as plugin icons.

#### Properties

| Property | Type   | Required | Description                                                                                                                  |
| -------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `large`  | string | **Yes**  | Link to the "large" version of the plugin logo, which must be an SVG image. "Large" and "small" logos can be the same image. |
| `small`  | string | **Yes**  | Link to the "small" version of the plugin logo, which must be an SVG image. "Large" and "small" logos can be the same image. |

### screenshots

#### Properties

| Property | Type   | Required | Description |
| -------- | ------ | -------- | ----------- |
| `name`   | string | No       |             |
| `path`   | string | No       |             |

## queryOptions

For data source plugins. There is a query options section in the plugin's query editor and these options can be turned on if needed.

### Properties

| Property        | Type    | Required | Description                                                                                                                |
| --------------- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `cacheTimeout`  | boolean | No       | For data source plugins. If the `cache timeout` option should be shown in the query options section in the query editor.   |
| `maxDataPoints` | boolean | No       | For data source plugins. If the `max data points` option should be shown in the query options section in the query editor. |
| `minInterval`   | boolean | No       | For data source plugins. If the `min interval` option should be shown in the query options section in the query editor.    |

## roles

List of RBAC roles defined by the plugin and their default assignments to basic roles (`Viewer`, `Editor`, `Admin`, `Grafana Admin`).

Requires Grafana version 9.4.0 or later. Currently, this is behind the `accessControlOnCall` feature toggle.

### Properties

| Property | Type            | Required | Description                                                                                           |
| -------- | --------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `role`   | [object](#role) | **Yes**  | RBAC role definition to group related RBAC permissions on the plugin.                                 |
| `grant`  | string[]        | No       | Default assignments of the role to Grafana basic roles (`Viewer`, `Editor`, `Admin`, `Grafana Admin`) |

### role

A role groups your plugin's related RBAC permissions (ex: `Projects Admin` would group permissions to create, read, write and delete projects).
The RBAC actions defined in your role must start with your plugin `id` (ex: `grafana-test-app.projects:read`).

| Property      | Type                     | Required | Description                    |
| ------------- | ------------------------ | -------- | ------------------------------ |
| `name`        | string                   | **Yes**  | Name of the role.              |
| `description` | string                   | No       | Describes the aim of the role. |
| `permissions` | [object](#permissions)[] | No       | RBAC permission on the plugin. |

## routes

For data source plugins. Proxy routes used for plugin authentication and adding headers to HTTP requests made by the plugin. For more information, refer to [Authentication for data source plugins](/create-a-plugin/extend-a-plugin/add-authentication-for-data-source-plugins.md).

### Properties

| Property       | Type                    | Required | Description                                                                                                                               |
| -------------- | ----------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `body`         | [object](#body)         | No       | For data source plugins. Route headers set the body content and length to the proxied request.                                            |
| `headers`      | array                   | No       | For data source plugins. Route headers adds HTTP headers to the proxied request.                                                          |
| `jwtTokenAuth` | [object](#jwttokenauth) | No       | For data source plugins. Token authentication section used with an JWT OAuth API.                                                         |
| `method`       | string                  | No       | For data source plugins. Route method matches the HTTP verb like GET or POST. Multiple methods can be provided as a comma-separated list. |
| `path`         | string                  | No       | For data source plugins. The route path that is replaced by the route URL field when proxying the call.                                   |
| `reqAction`    | string                  | No       | The RBAC action a user must have to use this route.                                                                                       |
| `reqRole`      | string                  | No       |                                                                                                                                           |
| `reqSignedIn`  | boolean                 | No       |                                                                                                                                           |
| `tokenAuth`    | [object](#tokenauth)    | No       | For data source plugins. Token authentication section used with an OAuth API.                                                             |
| `url`          | string                  | No       | For data source plugins. Route URL is where the request is proxied to.                                                                    |

### body

For data source plugins. Route headers set the body content and length to the proxied request.

| Property | Type | Required | Description |
| -------- | ---- | -------- | ----------- |

### jwtTokenAuth

For data source plugins. Token authentication section used with an JWT OAuth API.

#### Properties

| Property | Type              | Required | Description                                                           |
| -------- | ----------------- | -------- | --------------------------------------------------------------------- |
| `params` | [object](#params) | No       | Parameters for the JWT token authentication request.                  |
| `scopes` | string[]          | No       | The list of scopes that your application should be granted access to. |
| `url`    | string            | No       | URL to fetch the JWT token.                                           |

#### params

Parameters for the JWT token authentication request.

##### Properties

| Property       | Type   | Required | Description |
| -------------- | ------ | -------- | ----------- |
| `client_email` | string | No       |             |
| `private_key`  | string | No       |             |
| `token_uri`    | string | No       |             |

### tokenAuth

For data source plugins. Token authentication section used with an OAuth API.

#### Properties

| Property | Type              | Required | Description                                                           |
| -------- | ----------------- | -------- | --------------------------------------------------------------------- |
| `params` | [object](#params) | No       | Parameters for the token authentication request.                      |
| `scopes` | string[]          | No       | The list of scopes that your application should be granted access to. |
| `url`    | string            | No       | URL to fetch the authentication token.                                |

#### params

Parameters for the token authentication request.

##### Properties

| Property        | Type   | Required | Description                                                                               |
| --------------- | ------ | -------- | ----------------------------------------------------------------------------------------- |
| `client_id`     | string | No       | OAuth client ID                                                                           |
| `client_secret` | string | No       | OAuth client secret. Usually populated by decrypting the secret from the SecureJson blob. |
| `grant_type`    | string | No       | OAuth grant type                                                                          |
| `resource`      | string | No       | OAuth resource                                                                            |

## generated

**Shouldn't be edited manually.** This property is automatically generated by our build configuration using the `@grafana/plugin-meta-extractor` package. (The property should only be present in the build output (`dist/plugin.json`).

### Properties

| Property     | Type                    | Required | Description                                       |
| ------------ | ----------------------- | -------- | ------------------------------------------------- |
| `extensions` | [object](#extensions)[] | No       | An array of extensions that the plugin registers. |

### extensions

An array of extensions that the plugin registers.

#### Properties

| Property           | Type   | Required | Description                               |
| ------------------ | ------ | -------- | ----------------------------------------- |
| `extensionPointId` | string | **Yes**  |                                           |
| `type`             | string | **Yes**  | Available values: `"link"`, `"component"` |
| `title`            | string | No       |                                           |
| `description`      | string | No       |                                           |
