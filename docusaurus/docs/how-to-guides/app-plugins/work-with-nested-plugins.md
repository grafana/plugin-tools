---
id: work-with-nested-plugins
title: Work with nested plugins
description: How to work with nested plugins, Grafana app plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - advanced
  - apps
  - app plugins
  - nested
---

Grafana app plugins can nest data sources, both frontend and backend, together with panel plugins so that you can provide a complete user experience.

## Before you begin

Scaffold an app plugin. For instructions, refer to the tutorial to [build an app plugin](../../tutorials/build-an-app-plugin).

## Anatomy of nested plugins

Nested plugins are located inside the app plugin `src` folder. They generally follow the same structure of a plugin and have their own `plugin.json`, but they don't have their own `package.json` or `.config` folder.

Here's an example of a nested data source plugin:

```diff bash
./src
 ├── README.md
 ├── components
+├── nested-datasource
+│   ├── components
+│   │   ├── ConfigEditor.tsx
+│   │   └── QueryEditor.tsx
+│   ├── datasource.ts
+│   ├── img
+│   ├── module.ts
+│   ├── plugin.json
+│   └── types.ts
 ├── img
 │   └── logo.svg
 ├── module.ts
 └── plugin.json
```

## When to use a nested plugin

When you have a data source or panel plugin that you want to distribute along with your app plugin,

each nested data source can have its own backend, independent of the app plugin's backend.

:::note

Notice that the plugin `nested-datasource` doesn't have a `package.json` of its own. The name of the nested plugin folder isn't important.

:::

## How to add a nested plugin to an app plugin

1. Create a new plugin that will become the nested plugin:

   :::important

   Begin outside your app plugin's directory.

   :::

   Use the `create-plugin` tool to generate a new plugin:

   ```bash
   npx @grafana/create-plugin@latest
   ```

   Select the desired plugin type (data source or panel), provide a name, and use the same organization as your app plugin.

1. Prepare the nested plugin:

   Rename the `src` folder of your newly generated plugin to a name that reflects its specific purpose (for example, `nested-datasource`).

1. Integrate into your app plugin:

   Copy the renamed `src` folder directly inside the `src` folder of your app plugin.
   You can safely disregard the other generated files (like `package.json`, `.config`, and so on). These files aren't needed within your app.

1. (Optional) Add your data source to your provisioned data sources:

   If you're adding a nested data source, remember to add it to the provisioned datasources YAML configuration file. Refer to the documentation on [Provisioning Grafana](https://grafana.com/docs/grafana/latest/administration/provisioning/#data-sources) for more details.

1. (Optional) Clean up your directory:

   You can now delete the entire directory of the initially generated nested plugin.

With these steps, your app plugin now houses the source code for your nested data source or panel, ready for further development.
