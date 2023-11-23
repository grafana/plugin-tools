---
id: best-practices
title: Best practices
description: An index of best practices for plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - best practices
sidebar_position: 5
---

This document summarizes best practices for Grafana plugins. This live document is updated as new best practices are identified.

## General

- Choose the right plugin type for your use case: panel, data-source or app. See [Plugin types](/introduction/plugin-types-usage) for more information.
- Verify that your data-source or app plugin can be provisioned. See [Provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/#data-sources) for more information.
- Include default dashboards in your data-source or app plugin. See [Bundling of dashboards](https://grafana.com/docs/grafana/latest/administration/provisioning/#data-sources) for more information.
- Ensure that the minimum version of Grafana is correct. This should point to the earliest version of Grafana that your plugin fully supports. This is specified as `grafanaDependency` in your plugin.json.

## Panel plugins

- Do not store or use credentials. Panel plugins do not have a way to securely store credentials. If your plugin needs to use credentials, consider using a data-source plugin instead and a panel plugin to display the information returned by the data-source.
- See how you can add more advanced options to your panel plugin [here](/create-a-plugin/extend-a-plugin/custom-panel-option-editors).

## Data-source plugins

- If your plugin needs to store credentials, use `secureJsonData` instead of `jsonData`. The former is encrypted at rest while the latter is not. See [Secure JSON data](/create-a-plugin/extend-a-plugin/add-authentication-for-data-source-plugins#store-configuration-in-securejsondata) for more information.
- Implement a query builder. This is highly useful for users who are not familiar with the query language of the data-source. See, for example, the [Query Builder for Microsoft SQL Server](https://grafana.com/docs/grafana/latest/datasources/mssql/query-editor/#builder-mode) which helps write SQL queries for that service.
- Add a health check for your plugin. This is used to verify that the data-source is working properly. More information in [Health checks](/introduction/backend-plugins#health-checks). Depending on the type of plugin (frontend or backend) the implementation methods differ. See this [example](https://github.com/grafana/grafana-plugin-examples/blob/5441fe2f818e28cdeb06eb7066ff198dd34bb0ab/examples/datasource-http/src/DataSource.ts#L81-L115) for a health check in the frontend or this [example](https://github.com/grafana/grafana-plugin-examples/blob/0532f8b23645251997088ac7a1707a72d3fd9248/examples/datasource-basic/pkg/plugin/datasource.go#L77) in the backend.
- Add [dashboard variables](https://grafana.com/docs/grafana/latest/dashboards/variables/) support. Dashboard (or template) variables allow users to create dynamic dashboards. There are two aspects of adding support for variables in your plugin. The first is allowing querying your data-source and return values that will be used as variables. The second is replacing existing variables in other queries. See how you can do it [here](/create-a-plugin/extend-a-plugin/add-support-for-variables#add-support-for-query-variables-to-your-data-source). Pay special attention when selecting "All values" since it may require specific logic to join variable values.
- Add annotations support. Annotations allow users to add contextual information to their dashboards and it's possible to use queries to define them. See how you can do it [here](/create-a-plugin/extend-a-plugin/enable-for-annotations).
- When building frontend components, make sure to use [Grafana components](https://developers.grafana.com/ui/latest/index.html?path=/docs/docs-overview-intro--page) as the base and follow the [Saga Design System](https://grafana.com/blog/2023/11/07/saga-design-system-shaping-the-future-of-user-experiences-at-grafana-labs/).
- Add query editor help. Query editors can be complex and it's useful to provide help to users. See how you can do it [here](/create-a-plugin/extend-a-plugin/add-query-editor-help).
- Skip hidden or empty queries. This avoids executing unnecessary or wrong queries. See this [example](https://github.com/grafana/grafana/blob/fd5f66083c91b9759ae7772f99b80c9342b93290/public/app/plugins/datasource/loki/datasource.ts#L1085).
- Specify a default query. This can be useful for users to discover how queries are written for the plugin. See an [example](https://github.com/grafana/grafana-plugin-examples/blob/0532f8b/examples/datasource-streaming-backend-websocket/streaming-backend-websocket-plugin/src/datasource.ts#L39-L41).
- Avoid using `console.log` in your plugin.

### Frontend (only) plugins

- Frontend-only data sources typically use the [Grafana proxy](/create-a-plugin/extend-a-plugin/add-authentication-for-data-source-plugins#add-a-proxy-route-to-your-plugin) to access an external service. While this is a simple way of adding support for queries in your plugin (and doesn't require Golang knowledge), it's generally recommended to write a backend part for your plugin. The use cases can be found [here](/introduction/backend-plugins#use-cases-for-implementing-a-backend-plugin).

### Backend plugins

- Add support for alerts. Backend plugins have inherent support for alerts but it needs to be enabled. Simply add `"enabled": true` to your plugin.json file.
- Use the `CallResourceHandler` interface to serve custom HTTP requests. More information in [Resource handlers](/introduction/backend-plugins#resource-handlers). This is useful, for example, when providing query builders. See an example [here](https://github.com/grafana/grafana-plugin-examples/blob/0532f8b23645251997088ac7a1707a72d3fd9248/examples/app-with-backend/pkg/plugin/app.go#L35).
- Add metrics to your data-source. More information [here](/introduction/backend-plugins#collect-metrics).
- Add tracing to your data-source. In addition to metrics, tracing allows you to deep dive into your plugin performance. More information [here](/create-a-plugin/extend-a-plugin/add-distributed-tracing-for-backend-plugins). And an example [here](https://github.com/grafana/grafana-plugin-examples/blob/0532f8b/examples/datasource-http-backend/pkg/plugin/datasource.go#L141-L156).
- Keep cached connections. This is an important optimization. More information [here](/introduction/backend-plugins#caching-and-connection-pooling) and an example [here](https://github.com/grafana/grafana-plugin-examples/blob/0532f8b23645251997088ac7a1707a72d3fd9248/examples/datasource-http-backend/pkg/plugin/datasource.go#L40-L66).
- Add macro support. Macros are similar to variables but they are tipically evaluated in the backend and it allows to return values based on environment data like the current time selection. These are usually defined using the syntax `$__macroName` (e.g. `$__timeFilter`). See this [example](https://github.com/grafana/grafana-plugin-examples/blob/0532f8b23645251997088ac7a1707a72d3fd9248/examples/datasource-basic/pkg/query/macro.go) to discover how you can implement it.
- For SQL data-sources, check out the [`sqlutil` package in the SDK](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/data/sqlutil). It includes multiple helpers to work with SQL data-sources for things like data frame conversion, default macros, etc.
- Do not use the local file system. Different plugins share the same environment and for security reasons, plugins should not rely on local files.
- Similar to the above, avoid the usage of environment variables. Those are also a security risk and should be avoided. For data-source-specific configuration, use the `jsonData` or `secureJsonData` fields in the plugin.json file. In case some generic configuration is needed for the plugin (shared among data-sources), use the [`plugin` configuration](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#pluginplugin_id).
- Plugins should not execute arbitrary code in the backend. Again, this is a security risk and should be avoided. If your plugin needs to execute code, provide a list of allowed commands and validate the input before executing it.
- Logged arguments should not expose sensitive information, such as secrets.
- In general, any error happening should be logged with level `error`.
- Using the `info` level is normally not recommended: use the `debug` level instead.

## App plugins

- Ensure that your app can be enabled and disabled.
- Specify a default page for your app.
- To generate dynamic apps, check out [Grafana Scenes](https://grafana.com/developers/scenes/).
