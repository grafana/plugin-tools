---
id: best-practices
title: Best practices
description: An index of plugin practices recommended by Grafana Labs.
keywords:
  - grafana
  - plugins
  - plugin
  - best practices
sidebar_position: 30
---

# Best practices for plugin development

We have compiled a list of practices for building and publishing high-quality plugins for Grafana that we have found beneficial. Refer to them when building your own plugin for best results.

Is something missing from this list? [Let us know](https://github.com/grafana/plugin-tools/issues/new).

## General

- **Verify that your data source or app plugin can be provisioned** - Refer to [Provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/#data-sources) for more information.
- **Include default dashboards in your data source or app plugin** - Refer to [Bundling of dashboards](../key-concepts/plugin-types-usage.md#bundling-of-dashboards) for more information.
- **Ensure that the minimum version of Grafana is correct** - Make sure that the `grafanaDependency` in your `plugin.json` points to the earliest version of Grafana that your plugin fully supports.
- **Don't expose sensitive information** - For security reasons, avoid exposing sensitive information such as secrets. Make sure to utilize log levels properly, avoid excessive logging, and never log credentials or other sensitive information.
- **Don't allow user input of arbitrary code** - For security reasons, don't let your plugin's users enter potentially malicious code to prevent arbitrary code execution.
- **Avoid using `console.log` in your plugin** - Console messages are usually for debugging purposes and therefore not suitable to ship to the client.
- **Add linting and auto-completion** - Reduce bugs in your plugin by adding a code snippet like [this one](https://grafana.com/blog/2021/01/21/6-tips-for-improving-your-grafana-plugin-before-you-publish/#tip-3-add-linting-and-auto-completion-to-your-pluginjson) in VS Code to get linting for your plugin.
- **Include a well-written README** - Give users a deeper understanding of how to configure and use your plugin, but don’t make it essential reading. You want users to be able to understand your plugin intuitively without referring to the documentation if possible.
- **Allow incremental learning** - Hide advanced options using switches or categories, and let users learn about advanced features when they’re ready.
- **Get beta testers** - Enlist users in your target audience to try out your plugin before you submit it. Get feedback to help improve your plugin before it's published.

## Panel plugins

- **Don't store or use credentials** - Panel plugins don't have a way to securely store credentials. If your plugin needs to use credentials, consider using a data source or app plugin instead and a panel plugin to display the information returned by the data source.

- **Consider creating custom options** - If the default panel options aren't a good fit for what you're trying to offer users, use [custom options](../how-to-guides/panel-plugins/custom-panel-option-editors).
- **Document the dataframe schema** - Consider [documenting the plugin's schema](https://grafana.com/blog/2021/01/21/6-tips-for-improving-your-grafana-plugin-before-you-publish/#tip-2-document-the-data-frame-schema-for-panel-plugins) (expected fields, field types, naming conventions for field names, etc.) in the README.

## Data source plugins

- **If your plugin needs to store credentials, use `secureJsonData` instead of `jsonData`** - The former is encrypted at rest while the latter isn't. Refer to [Secure JSON data](../how-to-guides/data-source-plugins/add-authentication-for-data-source-plugins#store-configuration-in-securejsondata) for more information.
- **Implement a query builder** - This is highly useful for users who are not familiar with the query language of the data source. Refer, for example, to the [Query Builder for Microsoft SQL Server](https://grafana.com/docs/grafana/latest/datasources/mssql/query-editor/#builder-mode) which helps write SQL queries for that service.
- **Add a health check for your plugin** - [Health checks](../key-concepts/backend-plugins/#health-checks) are used to verify that the data source is working properly. How this is implemented depends on whether the plugin has a backend. Refer to our examples for health checks in the [frontend](https://github.com/grafana/grafana-plugin-examples/blob/5441fe2f818e28cdeb06eb7066ff198dd34bb0ab/examples/datasource-http/src/DataSource.ts#L81-L115) and [backend](https://github.com/grafana/grafana-plugin-examples/blob/0532f8b23645251997088ac7a1707a72d3fd9248/examples/datasource-basic/pkg/plugin/datasource.go#L77). For the `backend` case, it's not necessary to modify its frontend code as long as it extends the [`DataSourceWithBackend`](https://github.com/grafana/grafana-plugin-examples/blob/0532f8b23645251997088ac7a1707a72d3fd9248/examples/datasource-basic/src/datasource.ts#L5) class from `@grafana/runtime`.
- **Add [dashboard variables](https://grafana.com/docs/grafana/latest/dashboards/variables/) support** - Dashboard (or template) variables allow users to create dynamic dashboards. There are two aspects of adding support for variables in your plugin. The first is allowing queries for your data source and return values to be used as variables. The second is replacing existing variables in other queries. For more information, refer to our [documentation](../how-to-guides/data-source-plugins/add-support-for-variables#add-support-for-query-variables-to-your-data-source). Pay special attention when selecting "All values" since it may require specific logic to join variable values.
- **Add annotations support** - Annotations allow users to add contextual information to their dashboards and it's possible to use queries to define them. For more information, refer to [Enable annotations](../how-to-guides/data-source-plugins/add-support-for-annotation-queries).
- **Practice good front-end design** - When building frontend components, make sure to use [Grafana components](https://developers.grafana.com/ui/latest/index.html?path=/docs/docs-overview-intro--page) as the base and follow the [Saga Design System](https://grafana.com/developers/saga/about/overview).
- **Add query editor help** - Query editors can be complex and it's useful to provide help to users. For more information, refer to [Add query editor help](../how-to-guides/data-source-plugins/add-query-editor-help).
- **Skip hidden or empty queries** - This avoids executing unnecessary or wrong queries. Data sources implementing [`DataSourceWithBackend`](https://github.com/grafana/grafana-plugin-examples/blob/0532f8b23645251997088ac7a1707a72d3fd9248/examples/datasource-basic/src/datasource.ts#L5) only need to implement the method `filterQuery`. Refer to this [example](https://github.com/grafana/grafana/blob/fd5f66083c91b9759ae7772f99b80c9342b93290/public/app/plugins/datasource/loki/datasource.ts#L1085).
- **Specify a default query** - Default queries can help users to discover how queries are written for the plugin. Refer to this [example](https://github.com/grafana/grafana-plugin-examples/blob/0532f8b/examples/datasource-streaming-backend-websocket/streaming-backend-websocket-plugin/src/datasource.ts#L39-L41).

### Frontend (only) plugins

- **Data sources running only on the frontend typically use the [Grafana proxy](../how-to-guides/data-source-plugins/add-authentication-for-data-source-plugins#add-a-proxy-route-to-your-plugin) to access an external service** - This is a simple way of adding support for queries in your plugin, and it doesn't require Golang knowledge. However, there are use cases for which writing a backend plugin is necessary. Refer to [Backend plugins](../key-concepts/backend-plugins/#use-cases-for-implementing-a-backend-plugin) for more information about those.

### Backend plugins

- **Add support for alerting** - Backend plugins have inherent support for [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/) but this support needs to be enabled. Simply add `"alerting": true` to your `plugin.json` file.
- **Use the `CallResourceHandler` interface to serve custom HTTP requests**. For more information, refer to [Resource handlers](../key-concepts/backend-plugins/#resources). This is useful, for example, when providing query builders, as shown in this [example](https://github.com/grafana/grafana-plugin-examples/blob/0532f8b23645251997088ac7a1707a72d3fd9248/examples/app-with-backend/pkg/plugin/app.go#L35).
- **Add logs, metrics and traces to your data source.** Make it easier to diagnose and resolve issues for both plugin developers and Grafana operators. Find more information in our [documentation](../how-to-guides/data-source-plugins/add-logs-metrics-traces-for-backend-plugins).
- **Keep cached connections** - This is an important optimization. To learn more, refer to our [documentation](../key-concepts/backend-plugins/#caching-and-connection-pooling) and an [example](https://github.com/grafana/grafana-plugin-examples/blob/0532f8b23645251997088ac7a1707a72d3fd9248/examples/datasource-http-backend/pkg/plugin/datasource.go#L40-L66).
- **Add macro support** - Macros are similar to variables, but they are typically evaluated in the backend and can return values based on environment data like the current time selection. It can be useful, for example, to evaluate alerts during a dynamic period. These are usually defined using the syntax `$__macroName` (for example, `$__timeFilter`). Refer to this [example](https://github.com/grafana/grafana-plugin-examples/blob/0532f8b23645251997088ac7a1707a72d3fd9248/examples/datasource-basic/pkg/query/macro.go) to discover how you can implement support. Some pre-defined macros are available in the [plugin SDK `macros` package](https://github.com/grafana/grafana-plugin-sdk-go/tree/main/experimental/macros).
- **For SQL data sources, refer to the [`sqlutil` package in the SDK](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/data/sqlutil)** - It includes multiple helpers to work with SQL data sources for things like data frame conversion, default macros, and so on. Also, consider using the [`sqlds` package](https://pkg.go.dev/github.com/grafana/sqlds) which highly simplifies the implementation of SQL data sources.
- **Don't use the local file system** - Different plugins share the same environment. For security reasons, plugins shouldn't rely on local files.
- **Don't use environment variables** - Environment variables are also a security risk and should be avoided. For configuration to a particular data source, use the `jsonData` or `secureJsonData` fields in the `plugin.json` file. If configuration is needed for the plugin which is shared among data sources, then use the [`plugin` configuration](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#pluginplugin_id).
- **Plugins should not execute arbitrary code in the backend** - Again, this is a security risk and should be avoided. If your plugin needs to execute code, provide a list of allowed commands and validate the input before executing it.
- **In general, any error happening should be logged with level `error`.**
- **Don't use the `info` level: use the `debug` level instead.**
- **Enable concurrent query execution** - This allows you to run multiple queries in parallel. To learn more, refer to our [documentation](/tutorials/build-a-data-source-backend-plugin#run-multiple-queries-concurrently).

## App plugins

- **Specify a root page for your app** - If your app defines multiple pages, make sure to select a default one that will be used as a landing page for your plugin.
- **Code split your app** - If you app contains multiple pages, make sure to use code splitting techniques to improve frontend load performance. By default Webpack will display warnings in terminal during build if any frontend assets are larger than 250kb. See the following links for more info:
  - [SurviveJs code splitting overview](https://survivejs.com/books/webpack/building/code-splitting)
  - [Official React lazy documentation](https://react.dev/reference/react/lazy)
- **To generate dynamic apps, consider using [Grafana Scenes](https://grafana.com/developers/scenes/).**
- **Consider contributing a [UI extension](../key-concepts/ui-extensions)** - UI extensions can help a user to discover your app in context and continue a given workflow. Additionally, if your app provides context that can be used in other apps, then create an extension point to allow these apps to do so, with no further changes required in your app.

## Publish a plugin

- **Add a GitHub badge** - Follow [these steps](https://grafana.com/blog/2024/06/06/6-tips-to-improve-your-grafana-plugin-before-you-publish/#tip-4-add-dynamic-badges-to-your-readme) to help users find your plugin using GitHub badges.
- **Add workflow automation** - If your plugin is available on GitHub, consider [adding the GitHub workflows](../get-started/set-up-development-environment.mdx#set-up-github-workflows) for plugin development to your repository.

## Manage plugin compatibility

In the Grafana plugin ecosystem, plugin compatibility with specific Grafana versions is determined by the semantic versioning range defined in the `grafanaDependency` property of the plugin's `plugin.json` file. Plugin authors must carefully select a version range that balances broad compatibility with the need for manageable maintenance efforts.

### Unique challenges in plugin development

Grafana plugins are a rather unusual piece of software in the sense that many npm dependencies used during compilation are replaced with different versions at runtime. For more details, refer to [Frontend NPM dependencies in a Grafana plugin](../key-concepts/manage-npm-dependencies.md). This runtime substitution can cause crashes if a plugin relies on APIs that are unavailable in the active Grafana environment. As a result, managing compatibility is a critical and complex aspect of plugin development.

### Best practices for managing plugin compatibility

To ensure robust and reliable plugins, follow these best practices:

- **Adopt the latest plugin APIs:** Using the latest plugin API versions allows developers to leverage new Grafana features and ensures alignment with the platform's evolving capabilities. It also encourages regular maintenance and updates of plugins and its dependencies.
- **Maintain a single development branch:** Aim to maintain a single branch for the entire range of Grafana versions supported by the plugin (as specified in the `grafanaDependency`). This approach reduces the maintenance burden and aligns with practices used in the Grafana plugin catalog.
- **Manage backward compatibility with runtime checks:** To utilize new Grafana features while maintaining compatibility with older versions, implement conditional logic that verifies feature availability at runtime. For guidance, see [Manage backwards compatibility with runtime checks](../how-to-guides/runtime-checks.md).
  <!-- Uncomment when this article is written - **Manage backward compatibility by using the compatibility packge:** -->
  <!-- Uncomment when this article is written - **Manage backward compatibility by bundling `grafana/ui`:** -->
- **Perform end-to-end testing using a Grafana version matrix:** Grafana's dependency-sharing mechanism can cause many plugin-related issues to appear only at runtime. These issues can be effectively identified by running end-to-end smoke tests across a matrix of Grafana versions defined in the plugin's `plugin.json` file. Regularly testing the plugin against both older supported versions and Grafana's main development branch ensures backward and forward compatibility. This approach allows plugin maintainers to verify functionality with current and upcoming Grafana releases, maintaining reliability and readiness for future updates.
