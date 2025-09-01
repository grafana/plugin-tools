---
id: plugin-lifecycle
title: Life cycle of a plugin
description: Learn about the life cycle of a Grafana plugin.
keywords:
  - grafana
  - plugins
  - plugin
  - lifecycle
  - life cycle
  - loading
  - unloading
  - installation
sidebar_position: 20
---

# Life cycle of a plugin

This document describes the various phases of a plugin such as installation and loading. The differences in a plugin's life cycle depend on its [type](./plugin-types-usage) and whether or not it has a [backend component](./backend-plugins/).

## Installing and uninstalling a plugin

For instructions to install or uninstall plugins, see [Plugin administration](https://grafana.com/docs/grafana/latest/administration/plugin-management/#install-grafana-plugins). If you're using Grafana Cloud, see [Find and use Grafana plugins](https://grafana.com/docs/grafana-cloud/introduction/find-and-use-plugins/).

When installed, a plugin is extracted into the _plugin directory_ in your filesystem. Similarly, uninstalling a plugin deletes the files from the same directory.

:::note

Use of the Grafana CLI to install or uninstall a plugin requires you to restart Grafana for the change to take effect. To avoid restarting Grafana, you can install a plugin directly from the Grafana [plugin catalog](https://grafana.com/plugins/) during runtime.

:::

## Loading plugins

Plugins are loaded either when Grafana starts up or when a plugin has been installed/uninstalled during runtime.

Understanding the different phases involved when Grafana is loading a plugin may help you better understand plugin usage and [troubleshoot](#troubleshooting) any unexpected behavior. For example, why a certain plugin is not marked as installed in the plugins catalog or for use within Grafana even though you've installed it.

For plugins with a [backend component](./backend-plugins), Grafana carries out the additional initialization process described in [Phase 3](#phase-3-plugin-backend-initialization).

:::note

The life cycle of plugins is tracked in-memory and is not persisted in Grafana’s database. This means that the phases described below occur every time the server is restarted.

:::

### Phase 1. Plugin discovery

Grafana discovers which plugins are installed by scanning directories on the file system for every `plugin.json`.

### Phase 2. Plugin loading 

All plugins that were discovered in the discovery phase are checked to make sure they’re valid. Some of the automated checks include:

- Plugins must have a valid [signature](https://grafana.com/docs/grafana/latest/administration/plugin-management/#plugin-signatures). Valid plugins are referred to as _verified plugins_.
- Angular detection. Given that [Angular is deprecated](https://grafana.com/docs/grafana/latest/developers/angular_deprecation/), if Angular support is disabled and Angular is detected in the plugin, then we record an error and don't allow the plugin to be loaded.

### Phase 3. Plugin backend initialization

For any verified plugin that has a backend component, Grafana configures the backend client to use HashiCorp’s Go Plugin System over RPC.

### Phase 4. Registration

All verified plugins are registered in an in-memory registry and become available within Grafana.

Registered plugins show as installed in the catalog and appear in views for selecting a panel or data source in a dashboard.

### Phase 5. Start the plugin backend

For registered plugins that have a backend component, Grafana starts to run the backend binary as a separate process using HashiCorp’s Go Plugin System over RPC. The supported plugin protocol and version is negotiated between Grafana (client) and the plugin (server) to give Grafana an understanding of the plugin's capabilities.

A Grafana plugin backend component has its own separate life cycle. So long as the plugin backend is running, Grafana will make sure to restart the backend in case it crashes or is terminated. When Grafana is shut down, the backend processes is then terminated.

### Phase 6. Client-side loading

After Grafana has started and the [HTTP API](https://grafana.com/docs/grafana/latest/developers/http_api/) is running, you'll receive the server-side rendered index page containing bootstrap data. This data includes the list of available plugins and a URI to a `module.js` file that Grafana uses to instantiate the plugin.

When you interact with a UI that requires a plugin, Grafana will _lazy load_ the plugin's `module.js` file:

- For **panel plugins**, when you open a dashboard with panels (or interact with any UI that requires a plugin), Grafana lazy-loads the necessary plugin’s code through a fetch request. Each plugin is loaded only once but its objects are initialized multiple times.

- **Data-source plugins** have multiple ways to load. For instance, if you select the data source in the dropdown selector in the Explore page or if you load a dashboard using it.  

- **App plugins** have two different loading modes: _lazy_ and _pre-load_. Lazy app plugins load only when you accesses the App menu item directly. Pre-load app plugins load with the Grafana app and can execute code as soon as the page loads.

:::note

While each plugin is loaded once only, its objects may be initialized multiple times. For example, a dashboard with 10 different panel plugins will load 10 plugin instances, one for each plugin. A dashboard with 10 panels of the same plugin will load the plugin once, which will have 10 instances.

:::

## Troubleshooting

You can check the [Grafana server log](https://grafana.com/docs/grafana/latest/troubleshooting/#troubleshoot-with-logs) for any unexpected errors or details related to loading a plugin. In addition, you can enable even more details by changing the [log level to debug](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#log).
