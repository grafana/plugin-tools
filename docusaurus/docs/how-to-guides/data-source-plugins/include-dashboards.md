---
id: include-dashboards
title: Include dashboards
description: Include dashboards in Grafana data source plugins.
keywords:
  - grafana
  - plugin
  - dashboards
  - datasource
  - bundling
---

This guide explains how to add pre-configured dashboards into data source Grafana plugins. By integrating pre-configured dashboards into your plugin, you can provide your users with a ready-to-use template, freeing them from having to build a dashboard from scratch.

We'll walk you through the process of bundling dashboards into plugins. The process involves creating a dashboard, adding it to your plugin, and then importing it into the plugin.

## Step 1: Create a dashboard

Start by creating the dashboard you want to bundle with your plugin. The [development environment](/get-started/set-up-development-environment) provided by create-plugin can aid with creating and testing dashboards.

### Export the dashboard

In this step, we export the dashboard to a JSON file so it can be placed in a file along with your plugin source code:

1. Open your dashboard within Grafana.
1. Click the **Share** icon at the top-left of the dashboard.
1. Click **Export**.
1. Select **Export for sharing externally**, and then click **Save to file**.

Exporting with this option replaces direct data source references with placeholders. This ensures the dashboard can make use of the user's data source instance when imported.

## Step 2: Add the dashboard to your plugin

1. Create a `dashboards` folder within the `src` directory of your plugin project.

1. Move your exported dashboard JSON file into the new `dashboards` folder.
   ```shell
   myorg-myplugin-datasource/
   └── src/
   // addition-highlight-start
       ├── dashboards/
       │   └── overview.json
   // addition-highlight-end
       ├── module.ts
       └── plugin.json
   ```
1. Update your `plugin.json` file to include a reference to the new dashboard resource, specifying the relative path to the dashboard file within the src folder.

   ```json title="src/plugin.json"
   {
     "includes": [
       {
         "name": "overview",
         "path": "dashboards/overview.json",
         "type": "dashboard"
       }
     ]
   }
   ```

   :::info

   Ensure the path is relative to the `src` directory. This is necessary for the plugin to correctly reference the dashboard JSON file from the `dist` directory once you build the frontend.

   :::

1. After adding the dashboard to your plugin, rebuild the plugin and restart Grafana to apply the new configuration.

## Step 3: Import the dashboard into your plugin

To test your newly created dashboard, import the dashboard:

1. Create or edit an existing instance of your data source.
1. Click **Dashboards** to list all included dashboards.
1. Click **Import** next to the dashboard you want to import. The dashboard is imported into your plugin.

## Conclusion

By bundling dashboards with your plugin, you can significantly improve the user onboarding experience. Pre-configured dashboards eliminate the need for users to set up common variables, panels, or queries from scratch. This can greatly enhance user satisfaction and efficiency!
