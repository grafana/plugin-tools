---
id: npm-dependencies
title: NPM dependencies
description: Learn about frontend NPM dependencies in Grafana plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - github
  - npm
  - dependencies
sidebar_position: 5
---

# Frontend NPM dependencies in a Grafana plugin

Frontend plugins in Grafana have their own unique dependencies, as well as dependencies that are shared with the Grafana application during runtime. This document focuses on how these shared dependencies, particularly the `@grafana` npm packages, are handled.

It's important to understand that while a plugin specifies the expected versions of these dependencies in its `package.json` file, they are dynamically linked to the Grafana version at runtime.

## Dynamic dependency linking

The plugin `package.json` may reference a specific version of a `@grafana` npm package, such as `@grafana/ui: 9.5.1`. Within development environments (such as the developers IDE or when running unit tests) this version of `@grafana/ui` will be used.

However, when the plugin is installed and executed within a Grafana instance, it inherits the version of the `@grafana` packages that the Grafana application is using. For example, if the Grafana version is 10.0.0, then the plugin uses version 10.0.0 of the shared `@grafana` dependencies from the Grafana application.

:::info

This dynamic dependency linking also applies to the [docker development environment](/get-started/set-up-development-environment) provided by create-plugin. When the plugin is running inside Grafana it will inherit the version of the `@grafana` dependencies from the Grafana application.

:::

## Dependency sharing mechanism

To facilitate this dynamic dependency linking, Grafana employs SystemJS for loading frontend plugin code and sharing some of the Grafana application's npm dependencies with plugins.

Grafana makes the decision to share dependencies for one of two reasons:

- **Singleton dependency requirement:** In some cases, only a single instance of a dependency can exist during runtime.
- **Performance optimization:** Sharing dependencies can enhance performance, especially when dealing with large dependency codebases.

## Requirements for sharing dependencies

To share dependencies, Grafana defines two key components:

- **[SystemJS](https://github.com/systemjs/systemjs) import map in Grafana:** The dependency must be listed in a SystemJS import map in the Grafana application.
- **Plugin build tool configuration:** The dependency must be externalized in the plugin's build tool configuration, which is primarily done using Webpack.

:::danger

Customizing the build tool configuration to change the external dependencies is not supported and will likely lead to plugin loading failure or bugs.

:::

## Compilation and runtime

As the Grafana application loads in the frontend, SystemJS registers all shared dependencies found in the import map. When the frontend plugin code is compiled, Grafana ensures that the externalized dependencies exist in the scope of the plugin's runtime environment.

When a user navigates to a Grafana page that requires a particular plugin, the following steps occur:

1. [SystemJS](https://github.com/systemjs/systemjs) _lazily loads_ the plugin's `module.js` file.
1. SystemJS instantiates the code within the `module.js` file, ensuring that it links up any shared dependencies with the external dependency references in the plugin, before executing the code.

This process enables Grafana to efficiently manage and share dependencies across various plugins while ensuring that the correct and compatible versions of shared dependencies are used during runtime.
