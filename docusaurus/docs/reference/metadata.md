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

The plugin.json file is required for all plugins. When Grafana starts, it scans the plugin folders and mounts every folder that contains a plugin.json file unless the folder contains a subfolder named dist. In that case, Grafana mounts the dist folder instead.

**Properties**

| Name                                          | Type       | Description                                                                                                                                                                                                                                                                                                                                                                                                  | Required |
| --------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------: |
| **id**                                        | `string`   | Unique name of the plugin. If the plugin is published on grafana.com, then the plugin `id` has to follow the naming conventions.<br/>Pattern: `^[0-9a-z]+\-([0-9a-z]+\-)?(app\|panel\|datasource)$`<br/>                                                                                                                                                                                                     |    ✅    |
| **type**                                      | `string`   | Plugin type.<br/>Enum: `"app"`, `"datasource"`, `"panel"`, `"renderer"`<br/>                                                                                                                                                                                                                                                                                                                                 |    ✅    |
| [**info**](#info)                             | `object`   | Metadata for the plugin. Some fields are used on the plugins page in Grafana and others on grafana.com if the plugin is published.<br/>                                                                                                                                                                                                                                                                      |    ✅    |
| **name**                                      | `string`   | Human-readable name of the plugin that is shown to the user in the UI.<br/>                                                                                                                                                                                                                                                                                                                                  |    ✅    |
| [**dependencies**](#dependencies)             | `object`   | Dependency information related to Grafana and other plugins.<br/>                                                                                                                                                                                                                                                                                                                                            |    ✅    |
| **$schema**                                   | `string`   | Schema definition for the plugin.json file. Used primarily for schema validation.<br/>                                                                                                                                                                                                                                                                                                                       |          |
| **alerting**                                  | `boolean`  | For data source plugins, if the plugin supports alerting. Requires `backend` to be set to `true`.<br/>                                                                                                                                                                                                                                                                                                       |          |
| **annotations**                               | `boolean`  | For data source plugins, if the plugin supports annotation queries.<br/>                                                                                                                                                                                                                                                                                                                                     |          |
| **autoEnabled**                               | `boolean`  | Set to true for app plugins that should be enabled and pinned to the navigation bar in all orgs.<br/>                                                                                                                                                                                                                                                                                                        |          |
| **backend**                                   | `boolean`  | If the plugin has a backend component.<br/>                                                                                                                                                                                                                                                                                                                                                                  |          |
| **buildMode**                                 | `string`   | The build mode of the plugin. This field is set automatically at build time, so it should not be provided manually.<br/>                                                                                                                                                                                                                                                                                     |          |
| **builtIn**                                   | `boolean`  | [internal only] Indicates whether the plugin is developed and shipped as part of Grafana. Also known as a 'core plugin'.<br/>                                                                                                                                                                                                                                                                                |          |
| **category**                                  | `string`   | Plugin category used on the Add data source page.<br/>Enum: `"tsdb"`, `"logging"`, `"cloud"`, `"tracing"`, `"profiling"`, `"sql"`, `"enterprise"`, `"iot"`, `"other"`<br/>                                                                                                                                                                                                                                   |          |
| [**enterpriseFeatures**](#enterprisefeatures) | `object`   | Grafana Enterprise specific features<br/>                                                                                                                                                                                                                                                                                                                                                                    |          |
| **executable**                                | `string`   | The first part of the file name of the backend component executable. There can be multiple executables built for different operating system and architecture. Grafana will check for executables named `<executable>_<$GOOS>_<lower case $GOARCH><.exe for Windows>`, e.g. `plugin_linux_amd64`. Combination of $GOOS and $GOARCH can be found here: https://golang.org/doc/install/source#environment.<br/> |          |
| **hideFromList**                              | `boolean`  | [internal only] Excludes the plugin from listings in Grafana's UI. Only allowed for `builtIn` plugins.<br/>                                                                                                                                                                                                                                                                                                  |          |
| [**includes**](#includes)                     | `object[]` | Resources to include in plugin.<br/>                                                                                                                                                                                                                                                                                                                                                                         |          |
| **logs**                                      | `boolean`  | For data source plugins, if the plugin supports logs. It may be used to filter logs only features.<br/>                                                                                                                                                                                                                                                                                                      |          |
| **metrics**                                   | `boolean`  | For data source plugins, if the plugin supports metric queries. Used to enable the plugin in the panel editor.<br/>                                                                                                                                                                                                                                                                                          |          |
| **multiValueFilterOperators**                 | `boolean`  | For data source plugins, if the plugin supports multi value operators in adhoc filters.<br/>                                                                                                                                                                                                                                                                                                                 |          |
| **pascalName**                                | `string`   | [internal only] The PascalCase name for the plugin. Used for creating machine-friendly identifiers, typically in code generation. If not provided, defaults to name, but title-cased and sanitized (only alphabetical characters allowed).<br/>Pattern: `^([A-Z][a-zA-Z]{1,62})$`<br/>                                                                                                                       |          |
| **preload**                                   | `boolean`  | Initialize plugin on startup. By default, the plugin initializes on first use. Useful for app plugins that should load without user interaction.<br/>                                                                                                                                                                                                                                                        |          |
| [**queryOptions**](#queryoptions)             | `object`   | For data source plugins. There is a query options section in the plugin's query editor and these options can be turned on if needed.<br/>                                                                                                                                                                                                                                                                    |          |
| [**routes**](#routes)                         | `object[]` | For data source plugins. Proxy routes used for plugin authentication and adding headers to HTTP requests made by the plugin. For more information, refer to [Authentication for data source plugins](https://grafana.com/developers/plugin-tools/how-to-guides/data-source-plugins/add-authentication-for-data-source-plugins).<br/>                                                                         |          |
| **skipDataQuery**                             | `boolean`  | For panel plugins. Hides the query editor.<br/>                                                                                                                                                                                                                                                                                                                                                              |          |
| **state**                                     | `string`   | Marks a plugin as a pre-release.<br/>Enum: `"alpha"`, `"beta"`<br/>                                                                                                                                                                                                                                                                                                                                          |          |
| **streaming**                                 | `boolean`  | For data source plugins, if the plugin supports streaming. Used in Explore to start live streaming.<br/>                                                                                                                                                                                                                                                                                                     |          |
| **tracing**                                   | `boolean`  | For data source plugins, if the plugin supports tracing. Used for example to link logs (e.g. Loki logs) with tracing plugins.<br/>                                                                                                                                                                                                                                                                           |          |
| [**iam**](#iam)                               | `object`   | Identity and Access Management.<br/>                                                                                                                                                                                                                                                                                                                                                                         |          |
| [**roles**](#roles)                           | `object[]` | List of RBAC roles and their default assignments.<br/>                                                                                                                                                                                                                                                                                                                                                       |          |
| [**extensions**](#extensions)                 | `object`   | Plugin extensions are a way to extend either the UI of core Grafana or other plugins.<br/>                                                                                                                                                                                                                                                                                                                   |          |

<a name="info"></a>

## info

Metadata for the plugin. Some fields are used on the plugins page in Grafana and others on grafana.com if the plugin is published.

**Properties**

| Name                                | Type       | Description                                                                                                                        | Required |
| ----------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- | :------: |
| [**author**](#infoauthor)           | `object`   | Information about the plugin author.<br/>                                                                                          |          |
| [**build**](#infobuild)             | `object`   | Build information<br/>                                                                                                             |          |
| **description**                     | `string`   | Description of plugin. Used on the plugins page in Grafana and for search on grafana.com.<br/>                                     |          |
| [**keywords**](#infokeywords)       | `string[]` | Array of plugin keywords. Used for search on grafana.com.<br/>                                                                     |    ✅    |
| [**links**](#infolinks)             | `object[]` | An array of link objects to be displayed on this plugin's project page in the form `{name: 'foo', url: 'http://example.com'}`<br/> |          |
| [**logos**](#infologos)             | `object`   | SVG images that are used as plugin icons.<br/>                                                                                     |    ✅    |
| [**screenshots**](#infoscreenshots) | `object[]` | An array of screenshot objects in the form `{name: 'bar', path: 'img/screenshot.png'}`<br/>                                        |          |
| **updated**                         | `string`   | Date when this plugin was built.<br/>Pattern: `^(\d{4}-\d{2}-\d{2}\|\%TODAY\%)$`<br/>                                              |    ✅    |
| **version**                         | `string`   | Project version of this commit, e.g. `6.7.x`.<br/>Pattern: `^(0\|[1-9]\d*)\.(0\|[1-9]\d*)\.(0\|[1-9]\d*)\|(\%VERSION\%)$`<br/>     |    ✅    |

<a name="infoauthor"></a>

### info\.author

Information about the plugin author.

**Properties**

| Name      | Type     | Description                                        | Required |
| --------- | -------- | -------------------------------------------------- | :------: |
| **name**  | `string` | Author's name.<br/>                                |          |
| **email** | `string` | Author's name.<br/>Format: `"email"`<br/>          |          |
| **url**   | `string` | Link to author's website.<br/>Format: `"uri"`<br/> |          |

<a name="infobuild"></a>

### info\.build

Build information

**Properties**

| Name       | Type     | Description                                               | Required |
| ---------- | -------- | --------------------------------------------------------- | :------: |
| **time**   | `number` | Time when the plugin was built, as a Unix timestamp.<br/> |          |
| **repo**   | `string` |                                                           |          |
| **branch** | `string` | Git branch the plugin was built from.<br/>                |          |
| **hash**   | `string` | Git hash of the commit the plugin was built from<br/>     |          |
| **number** | `number` |                                                           |          |
| **pr**     | `number` | GitHub pull request the plugin was built from<br/>        |          |
| **build**  | `number` | Build job number used to build this plugin.<br/>          |          |

<a name="infokeywords"></a>

### info\.keywords\[\]

Array of plugin keywords. Used for search on grafana.com.

**Items**

**Item Type:** `string`  
**Minimum Items:** 1  
<a name="infolinks"></a>

### info\.links\[\]

An array of link objects to be displayed on this plugin's project page in the form `{name: 'foo', url: 'http://example.com'}`

**Items**

**Item Properties**

| Name     | Type     | Description          | Required |
| -------- | -------- | -------------------- | :------: |
| **name** | `string` |                      |          |
| **url**  | `string` | Format: `"uri"`<br/> |          |

<a name="infologos"></a>

### info\.logos

SVG images that are used as plugin icons.

**Properties**

| Name      | Type     | Description                                                                                                                       | Required |
| --------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- | :------: |
| **small** | `string` | Link to the "small" version of the plugin logo, which must be an SVG image. "Large" and "small" logos can be the same image.<br/> |    ✅    |
| **large** | `string` | Link to the "large" version of the plugin logo, which must be an SVG image. "Large" and "small" logos can be the same image.<br/> |    ✅    |

<a name="infoscreenshots"></a>

### info\.screenshots\[\]

An array of screenshot objects in the form `{name: 'bar', path: 'img/screenshot.png'}`

**Items**

**Item Properties**

| Name     | Type     | Description | Required |
| -------- | -------- | ----------- | :------: |
| **name** | `string` |             |          |
| **path** | `string` |             |          |

<a name="dependencies"></a>

## dependencies

Dependency information related to Grafana and other plugins.

**Properties**

| Name                                      | Type       | Description                                                                                                                                                                                                                                | Required |
| ----------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------: |
| **grafanaVersion**                        | `string`   | (Deprecated) Required Grafana version for this plugin, e.g. `6.x.x 7.x.x` to denote plugin requires Grafana v6.x.x or v7.x.x.<br/>Pattern: `^([0-9]+)(\.[0-9x]+)?(\.[0-9x])?$`<br/>                                                        |          |
| **grafanaDependency**                     | `string`   | Required Grafana version for this plugin. Validated using https://github.com/npm/node-semver.<br/>Pattern: `^(<=\|>=\|<\|>\|=\|~\|\^)?([0-9]+)(\.[0-9x\*]+)?(\.[0-9x\*]+)?(\s(<=\|>=\|<\|=>)?([0-9]+)(\.[0-9x\*]+)?(\.[0-9x\*]+)?)?$`<br/> |    ✅    |
| [**plugins**](#dependenciesplugins)       | `object[]` | An array of required plugins on which this plugin depends. Only non-core (that is, external plugins) have to be specified in this list.<br/>                                                                                               |          |
| [**extensions**](#dependenciesextensions) | `object`   | Plugin extensions that this plugin depends on.<br/>                                                                                                                                                                                        |          |

<a name="dependenciesplugins"></a>

### dependencies\.plugins\[\]

An array of required plugins on which this plugin depends. Only non-core (that is, external plugins) have to be specified in this list.

**Items**

Plugin dependency. Used to display information about plugin dependencies in the Grafana UI.

**Item Properties**

| Name     | Type     | Description                                                         | Required |
| -------- | -------- | ------------------------------------------------------------------- | :------: |
| **id**   | `string` | Pattern: `^[0-9a-z]+\-([0-9a-z]+\-)?(app\|panel\|datasource)$`<br/> |    ✅    |
| **type** | `string` | Enum: `"app"`, `"datasource"`, `"panel"`<br/>                       |    ✅    |
| **name** | `string` |                                                                     |    ✅    |

<a name="dependenciesextensions"></a>

### dependencies\.extensions

Plugin extensions that this plugin depends on.

**Properties**

| Name                                                              | Type       | Description                                                         | Required |
| ----------------------------------------------------------------- | ---------- | ------------------------------------------------------------------- | :------: |
| [**exposedComponents**](#dependenciesextensionsexposedcomponents) | `string[]` | An array of exposed component ids that this plugin depends on.<br/> |          |

<a name="dependenciesextensionsexposedcomponents"></a>

#### dependencies\.extensions\.exposedComponents\[\]

An array of exposed component ids that this plugin depends on.

**Items**

**Item Type:** `string`  
<a name="enterprisefeatures"></a>

## enterpriseFeatures

Grafana Enterprise specific features

**Properties**

| Name                        | Type      | Description                                                                                   | Required |
| --------------------------- | --------- | --------------------------------------------------------------------------------------------- | :------: |
| **healthDiagnosticsErrors** | `boolean` | Enable/Disable health diagnostics errors. Requires Grafana >=7.5.5.<br/>Default: `false`<br/> |          |

<a name="includes"></a>

## includes\[\]

Resources to include in plugin.

**Items**

**Item Properties**

| Name           | Type      | Description                                                                                                                                                                                          | Required |
| -------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| **uid**        | `string`  | Unique identifier of the included resource<br/>                                                                                                                                                      |          |
| **type**       | `string`  | Enum: `"dashboard"`, `"page"`, `"panel"`, `"datasource"`<br/>                                                                                                                                        |          |
| **name**       | `string`  |                                                                                                                                                                                                      |          |
| **component**  | `string`  | (Legacy) The Angular component to use for a page.<br/>                                                                                                                                               |          |
| **role**       | `string`  | The minimum role a user must have to see this page in the navigation menu.<br/>Enum: `"Admin"`, `"Editor"`, `"Viewer"`<br/>                                                                          |          |
| **action**     | `string`  | The RBAC action a user must have to see this page in the navigation menu.<br/>                                                                                                                       |          |
| **path**       | `string`  | Used for app plugins.<br/>                                                                                                                                                                           |          |
| **addToNav**   | `boolean` | Add the include to the navigation menu.<br/>                                                                                                                                                         |          |
| **defaultNav** | `boolean` | Page or dashboard when user clicks the icon in the side menu.<br/>                                                                                                                                   |          |
| **icon**       | `string`  | Icon to use in the side menu. For information on available icon, refer to [Icons Overview](https://developers.grafana.com/ui/latest/index.html?path=/story/docs-overview-icon--icons-overview).<br/> |          |

<a name="queryoptions"></a>

## queryOptions

For data source plugins. There is a query options section in the plugin's query editor and these options can be turned on if needed.

**Properties**

| Name              | Type      | Description                                                                                                                     | Required |
| ----------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- | :------: |
| **maxDataPoints** | `boolean` | For data source plugins. If the `max data points` option should be shown in the query options section in the query editor.<br/> |          |
| **minInterval**   | `boolean` | For data source plugins. If the `min interval` option should be shown in the query options section in the query editor.<br/>    |          |
| **cacheTimeout**  | `boolean` | For data source plugins. If the `cache timeout` option should be shown in the query options section in the query editor.<br/>   |          |

<a name="routes"></a>

## routes\[\]

For data source plugins. Proxy routes used for plugin authentication and adding headers to HTTP requests made by the plugin. For more information, refer to [Authentication for data source plugins](https://grafana.com/developers/plugin-tools/how-to-guides/data-source-plugins/add-authentication-for-data-source-plugins).

**Items**

For data source plugins. Proxy routes used for plugin authentication and adding headers to HTTP requests made by the plugin. For more information, refer to [Authentication for data source plugins](https://grafana.com/developers/plugin-tools/how-to-guides/data-source-plugins/add-authentication-for-data-source-plugins).

**Item Properties**

| Name                                    | Type       | Description                                                                                                                                    | Required |
| --------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| **path**                                | `string`   | For data source plugins. The route path that is replaced by the route URL field when proxying the call.<br/>                                   |          |
| **method**                              | `string`   | For data source plugins. Route method matches the HTTP verb like GET or POST. Multiple methods can be provided as a comma-separated list.<br/> |          |
| **url**                                 | `string`   | For data source plugins. Route URL is where the request is proxied to.<br/>                                                                    |          |
| **reqSignedIn**                         | `boolean`  |                                                                                                                                                |          |
| **reqRole**                             | `string`   |                                                                                                                                                |          |
| **reqAction**                           | `string`   | The RBAC action a user must have to use this route.<br/>                                                                                       |          |
| [**headers**](#routesheaders)           | `array`    | For data source plugins. Route headers adds HTTP headers to the proxied request.<br/>                                                          |          |
| [**body**](#routesbody)                 | `object`   | For data source plugins. Route headers set the body content and length to the proxied request.<br/>                                            |          |
| [**tokenAuth**](#routestokenauth)       | `object`   | For data source plugins. Token authentication section used with an OAuth API.<br/>                                                             |          |
| [**jwtTokenAuth**](#routesjwttokenauth) | `object`   | For data source plugins. Token authentication section used with an JWT OAuth API.<br/>                                                         |          |
| [**urlParams**](#routesurlparams)       | `object[]` | Add URL parameters to a proxy route<br/>                                                                                                       |          |

<a name="routesheaders"></a>

### routes\[\]\.headers\[\]

For data source plugins. Route headers adds HTTP headers to the proxied request.

<a name="routesbody"></a>

### routes\[\]\.body

For data source plugins. Route headers set the body content and length to the proxied request.

<a name="routestokenauth"></a>

### routes\[\]\.tokenAuth

For data source plugins. Token authentication section used with an OAuth API.

**Properties**

| Name                                 | Type       | Description                                                                | Required |
| ------------------------------------ | ---------- | -------------------------------------------------------------------------- | :------: |
| **url**                              | `string`   | URL to fetch the authentication token.<br/>                                |          |
| [**scopes**](#routestokenauthscopes) | `string[]` | The list of scopes that your application should be granted access to.<br/> |          |
| [**params**](#routestokenauthparams) | `object`   | Parameters for the token authentication request.<br/>                      |          |

<a name="routestokenauthscopes"></a>

#### routes\[\]\.tokenAuth\.scopes\[\]

The list of scopes that your application should be granted access to.

**Items**

**Item Type:** `string`  
<a name="routestokenauthparams"></a>

#### routes\[\]\.tokenAuth\.params

Parameters for the token authentication request.

**Properties**

| Name              | Type     | Description                                                                                    | Required |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------- | :------: |
| **grant_type**    | `string` | OAuth grant type<br/>                                                                          |          |
| **client_id**     | `string` | OAuth client ID<br/>                                                                           |          |
| **client_secret** | `string` | OAuth client secret. Usually populated by decrypting the secret from the SecureJson blob.<br/> |          |
| **resource**      | `string` | OAuth resource<br/>                                                                            |          |

<a name="routesjwttokenauth"></a>

### routes\[\]\.jwtTokenAuth

For data source plugins. Token authentication section used with an JWT OAuth API.

**Properties**

| Name                                    | Type       | Description                                                                | Required |
| --------------------------------------- | ---------- | -------------------------------------------------------------------------- | :------: |
| **url**                                 | `string`   | URL to fetch the JWT token.<br/>Format: `"uri"`<br/>                       |          |
| [**scopes**](#routesjwttokenauthscopes) | `string[]` | The list of scopes that your application should be granted access to.<br/> |          |
| [**params**](#routesjwttokenauthparams) | `object`   | Parameters for the JWT token authentication request.<br/>                  |          |

<a name="routesjwttokenauthscopes"></a>

#### routes\[\]\.jwtTokenAuth\.scopes\[\]

The list of scopes that your application should be granted access to.

**Items**

**Item Type:** `string`  
<a name="routesjwttokenauthparams"></a>

#### routes\[\]\.jwtTokenAuth\.params

Parameters for the JWT token authentication request.

**Properties**

| Name             | Type     | Description | Required |
| ---------------- | -------- | ----------- | :------: |
| **token_uri**    | `string` |             |          |
| **client_email** | `string` |             |          |
| **private_key**  | `string` |             |          |

<a name="routesurlparams"></a>

### routes\[\]\.urlParams\[\]

Add URL parameters to a proxy route

**Items**

**Item Properties**

| Name        | Type     | Description                     | Required |
| ----------- | -------- | ------------------------------- | :------: |
| **name**    | `string` | Name of the URL parameter<br/>  |          |
| **content** | `string` | Value of the URL parameter<br/> |          |

<a name="iam"></a>

## iam

Identity and Access Management.

**Properties**

| Name                               | Type       | Description                                                                                       | Required |
| ---------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- | :------: |
| [**permissions**](#iampermissions) | `object[]` | Permissions are the permissions that the plugin needs its associated service account to have<br/> |          |

<a name="iampermissions"></a>

### iam\.permissions\[\]

Permissions are the permissions that the plugin needs its associated service account to have

**Items**

**Item Properties**

| Name       | Type     | Description | Required |
| ---------- | -------- | ----------- | :------: |
| **action** | `string` |             |          |
| **scope**  | `string` |             |          |

<a name="roles"></a>

## roles\[\]

List of RBAC roles and their default assignments.

**Items**

**Item Properties**

| Name                       | Type       | Description                                                                                        | Required |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------- | :------: |
| [**role**](#rolesrole)     | `object`   | RBAC role definition to bundle related RBAC permissions on the plugin.<br/>                        |          |
| [**grants**](#rolesgrants) | `string[]` | Default assignments of the role to Grafana basic roles (Viewer, Editor, Admin, Grafana Admin)<br/> |          |

<a name="rolesrole"></a>

### roles\[\]\.role

RBAC role definition to bundle related RBAC permissions on the plugin.

**Properties**

| Name                                     | Type       | Description                         | Required |
| ---------------------------------------- | ---------- | ----------------------------------- | :------: |
| **name**                                 | `string`   | Display name of the role.<br/>      |          |
| **description**                          | `string`   | Describe the aim of the role.<br/>  |          |
| [**permissions**](#rolesrolepermissions) | `object[]` | RBAC permission on the plugin.<br/> |          |

<a name="rolesrolepermissions"></a>

#### roles\[\]\.role\.permissions\[\]

RBAC permission on the plugin.

**Items**

**Item Properties**

| Name       | Type     | Description | Required |
| ---------- | -------- | ----------- | :------: |
| **action** | `string` |             |          |
| **scope**  | `string` |             |          |

<a name="rolesgrants"></a>

### roles\[\]\.grants\[\]

Default assignments of the role to Grafana basic roles (Viewer, Editor, Admin, Grafana Admin)

**Items**

**Item Type:** `string`  
<a name="extensions"></a>

## extensions

Plugin extensions are a way to extend either the UI of core Grafana or other plugins.

**Properties**

| Name                                                  | Type       | Description                                                                                 | Required |
| ----------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------- | :------: |
| [**addedComponents**](#extensionsaddedcomponents)     | `object[]` | Any component extensions that your plugin registers to extension points.<br/>               |          |
| [**addedLinks**](#extensionsaddedlinks)               | `object[]` | Any link extensions that your plugin registers to extension points.<br/>                    |          |
| [**exposedComponents**](#extensionsexposedcomponents) | `object[]` | Any React component that your plugin exposes so it can be reused by other app plugins.<br/> |          |
| [**extensionPoints**](#extensionsextensionpoints)     | `object[]` | Any extension points that your plugin provides.<br/>                                        |          |

<a name="extensionsaddedcomponents"></a>

### extensions\.addedComponents\[\]

Any component extensions that your plugin registers to extension points.

**Items**

**Item Properties**

| Name                                             | Type       | Description                                                                       | Required |
| ------------------------------------------------ | ---------- | --------------------------------------------------------------------------------- | :------: |
| [**targets**](#extensionsaddedcomponentstargets) | `string[]` | The list of the targeted extension point ids that the component is added to.<br/> |    ✅    |
| **title**                                        | `string`   | An informative title for your component extension.<br/>Minimal Length: `10`<br/>  |    ✅    |
| **description**                                  | `string`   | Additional information about your component extension.<br/>                       |          |

<a name="extensionsaddedcomponentstargets"></a>

#### extensions\.addedComponents\[\]\.targets\[\]

The list of the targeted extension point ids that the component is added to.

**Items**

**Item Type:** `string`  
<a name="extensionsaddedlinks"></a>

### extensions\.addedLinks\[\]

Any link extensions that your plugin registers to extension points.

**Items**

**Item Properties**

| Name                                        | Type       | Description                                                                  | Required |
| ------------------------------------------- | ---------- | ---------------------------------------------------------------------------- | :------: |
| [**targets**](#extensionsaddedlinkstargets) | `string[]` | The list of the targeted extension point ids that the link is added to.<br/> |    ✅    |
| **title**                                   | `string`   | An informative title for your link extension.<br/>Minimal Length: `10`<br/>  |    ✅    |
| **description**                             | `string`   | Additional information about your link extension.<br/>                       |          |

<a name="extensionsaddedlinkstargets"></a>

#### extensions\.addedLinks\[\]\.targets\[\]

The list of the targeted extension point ids that the link is added to.

**Items**

**Item Type:** `string`  
<a name="extensionsexposedcomponents"></a>

### extensions\.exposedComponents\[\]

Any React component that your plugin exposes so it can be reused by other app plugins.

**Items**

**Item Properties**

| Name            | Type     | Description                                                                                                                                                                                                                                                                         | Required |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| **id**          | `string` | A unique identifier for your exposed component. This is used to reference the component in other plugins. It must be in the following format: `{PLUGIN_ID}/name-of-component/v1`.<br/>Pattern: `^[0-9a-z]+-([0-9a-z]+-)?(app\|panel\|datasource)\/[a-zA-Z0-9_-]+\/v[0-9_.-]+$`<br/> |    ✅    |
| **title**       | `string` | An informative title for your exposed component.<br/>                                                                                                                                                                                                                               |          |
| **description** | `string` | Additional information about your exposed component.<br/>                                                                                                                                                                                                                           |          |

<a name="extensionsextensionpoints"></a>

### extensions\.extensionPoints\[\]

Any extension points that your plugin provides.

**Items**

**Item Properties**

| Name            | Type     | Description                                                                                                                                                                                                                                                                                      | Required |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------: |
| **id**          | `string` | A unique identifier for your extension point. This is used to reference the extension point in other plugins. It must be in the following format: `{PLUGIN_ID}/name-of-my-extension-point/v1`.<br/>Pattern: `^[0-9a-z]+-([0-9a-z]+-)?(app\|panel\|datasource)\/[a-zA-Z0-9_-]+\/v[0-9_.-]+$`<br/> |    ✅    |
| **title**       | `string` | An informative title for your extension point.<br/>                                                                                                                                                                                                                                              |          |
| **description** | `string` | Additional information about your extension point.<br/>                                                                                                                                                                                                                                          |          |
