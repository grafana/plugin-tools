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

This document describes the various phases of a plugin such as installation and loading. We will describe the differences in a plugin's life cycle depending on its type and whether or not it has a [backend](./backend-plugins/).

## Installing and uninstalling a plugin

For instructions to install or uninstall plugins, see our documentation at [Plugin administration](https://grafana.com/docs/grafana/latest/administration/plugin-management/#install-grafana-plugins).

Upon installation, a plugin is extracted to the _plugin directory_ on the filesystem. Similarly, uninstalling a plugin deletes the files from the same directory.

:::note

Use of the Grafana CLI to install or uninstall a plugin requires you to restart Grafana for the change to take effect. To avoid restarting Grafana, you can install a plugin from within the Grafana [plugin catalog](https://grafana.com/plugins/) during runtime.

:::

## Loading plugins

Plugins are loaded either when Grafana starts up or when a plugin has been installed/uninstalled during runtime.

Understanding the different phases involved when Grafana is loading a plugin may help you better understand plugin usage and [troubleshoot](#troubleshooting) any unexpected behavior. For example, why a certain plugin is not marked as installed in the plugins catalog or for use within Grafana even though you've installed it.

For plugins with a [backend](./backend-plugins) component, Grafana carries out the additional initialization process described in [Phase 3](#phase-3-plugin-backend-initialization).

:::note

The life cycle of plugins is tracked in-memory and is not persisted in Grafana’s database. This means that the phases described below occur every time the server is restarted.

:::

### Phase 1. Plugin discovery

Grafana starts to discover which plugins are installed by scanning directories on the file system for every `plugin.json`.

### Phase 2. Plugin loading

All plugins that were discovered in the discovery phase are checked to make sure they’re valid. Some of the automated checks include:

- Plugins must have a valid [signature](https://grafana.com/docs/grafana/latest/administration/plugin-management/#plugin-signatures). Valid plugins are referred to as _verified plugins_.
- Angular detection: Given that [Angular is deprecated](https://grafana.com/docs/grafana/latest/developers/angular_deprecation/), if Angular support is disabled and Angular is detected in the plugin, then we record an error and don't allow the plugin to be loaded.

### Phase 3. Plugin backend initialization

For any verified plugin that has a backend, Grafana configures the backend client to use HashiCorp’s Go Plugin System over RPC.

### Phase 4. Registration

All verified plugins are registered in an in-memory registry. From now on, the plugin is available within Grafana and so are referred to as _registered plugins_.

Registered plugins show as installed in the catalog and appear in views for selecting a panel or data source in a dashboard.

### Phase 5. Start the plugin backend

For registered plugins that have a backend, Grafana starts to run the backend binary as a separate process using HashiCorp’s Go Plugin System over RPC. The supported plugin protocol and version is negotiated between Grafana (client) and the plugin (server) to give Grafana an understanding of the plugin's capabilities.

A Grafana plugin backend component has its own separate life cycle. So long as the plugin backend is running, Grafana will make sure to restart the backend in case it crashes or is terminated. When Grafana is shut down, the backend processes is then terminated.

### Phase 6. Client-side loading

After Grafana has started and the [HTTP API](https://grafana.com/docs/grafana/latest/developers/http_api/) is running, Grafana users receive the server-side rendered index page containing bootstrap data. This data includes the list of available plugins and a URI to a `module.js` file that Grafana uses to instantiate the plugin.

When the user interacts with a UI that requires a plugin, Grafana will _lazy load_ the plugin's `module.js` file:

- **Panel plugins** - When the user opens a dashboard with panels (or interacts with any UI that requires a plugin), Grafana lazy-loads the necessary plugin’s code through a fetch request. Each plugin is loaded only once but its objects are initialized multiple times.

- **Data-source plugins** - A data-source plugin could be loaded in more than one way. For instance, it could be loaded in the Explore page if the user selects the data source in the dropdown, or if they load a dashboard containing a plugin data source.

- **App plugins** - Apps have two different loading modes: _lazy_ and _pre-load_. Lazy app plugins load only when the user accesses the App menu item directly. Pre-load app plugins load with the Grafana app and can execute code as soon as the page loads.

:::note

While each plugin is loaded once only, its objects are initialized multiple times. For example, a dashboard with 10 different panel plugins will load 10 plugin instances, one for each plugin. A dashboard with 10 panels of the same plugin will load same plugin once, which will have 10 instances.

:::

## Troubleshooting

You can check the [Grafana server log](https://grafana.com/docs/grafana/latest/troubleshooting/#troubleshoot-with-logs) for any unexpected errors or details related to loading a plugin. In addition, you can enable even more details by changing the [log level to debug](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#log).
