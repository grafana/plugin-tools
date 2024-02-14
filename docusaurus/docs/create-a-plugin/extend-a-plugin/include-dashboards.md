---
id: include-dashboards
title: Including dashboards
description: Include dashboards in Grafana datasource and app plugins
keywords:
  - grafana
  - plugin
  - dashboards
  - app
  - datasource
---

# Including dashboards with a plugin

This guide focuses on integrating dashboards into app and datasource plugins. By bundling pre-configured dashboards, users can more easily understand the full potential of a plugin without the need to build dashboards from scratch. We'll walk you through the process of including these dashboards in your plugins.

## Create a dashboard

Start by creating the dashboard you wish to bundle with your plugin. The development environment provided by create-plugin can aid with creating and testings dashboards. Below we cover the steps for both datasource and app plugins, including tips for crafting an effective dashboard.

### Datasource plugins

#### Export the dashboard

In this step, we export the dashboard to a JSON file so it can be placed in a file along your plugin source code.

1. Open your dashboard within Grafana.
1. Click the Share icon in at the top-left of the dashboard.
1. Click **Export**.
1. Enable **Export for sharing externally**, and then click **Save to file**.

Exporting with this option replaces direct data source references with placeholders. This ensures the dashboard can make use of the user's data source instance when imported.

### App plugins

#### Setting Up a Datasource Variable

To facilitate user customization, create a dashboard data source variable. This allows users to link their own data source instances easily once imported.

1. Create a datasource variable by choosing the data source variable type and give it a name
   ![Datasource variable](/img/app-dashboard-ds-variable.png)
1. Each panel that you create should use the datasource variable as its datasource
   ![Datasource selection](/img/app-dashboard-ds-select.png)

#### Export the dashboard

1. Navigate to your dashboard in the Grafana application
1. Click the Share icon in at the top-left of the dashboard.
1. Click **Export** and then click **Save to file**.
1. Open the dashboard json file in your code editor and set it's `id` property to `null`.

## Add the dashboard to your plugin

Create a dashboards folder within the src directory of your plugin project. Move your exported dashboard JSON file into this folder.

```shell
myorg-myplugin-datasource/
└── src/
// addition-highlight-next-line
    ├── dashboards/
// addition-highlight-next-line
    │   └── overview.json
    ├── module.ts
    └── plugin.json
```

Then, update your plugin.json file to include a reference to the new dashboard resource, specifying the relative path to the dashboard file within the src folder.

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
Ensure the path is relative to the src directory. This is necessary for the plugin to correctly reference the dashboard json file from the dist directory once the frontend is built.
:::

After adding the dashboard to your plugin, rebuild the plugin and restart Grafana to apply the new configuration.

## Import the dashboard

To test your newly created dashboard you can import the dashboard:

### Datasource dashboards

1. Create or edit an existing instance of your data source.
1. Click Dashboards to list all included dashboards.
1. Click Import next to the dashboard you want to import.
1. Import dashboard

### App dashboards

App dashboards are automatically discovered by the Grafana server and imported when the server starts.

### Adding navigation links

To enhance user navigation, you can add an additional page include to the plugin.json. The path should reference the bundled dashboard `uid` property.

```json title="src/plugin.json"
{
  "includes": [
    {
      "name": "My App Dashboard",
      "path": "dashboards/overview.json",
      "type": "dashboard"
    },
    // addition-highlight-next-line
    {
      // addition-highlight-next-line
      "addToNav": true,
      // addition-highlight-next-line
      "name": "My App Dashboard",
      // addition-highlight-next-line
      "path": "d/ffb13c35-2f2f-4f36-99b1-bde7244e8de3",
      // addition-highlight-next-line
      "type": "page"
      // addition-highlight-next-line
    }
  ]
}
```

## Enhancing User Onboarding

By bundling dashboards with your plugin, you significantly improve the user onboarding experience. Pre-configured dashboards serve as ready-to-use templates, eliminating the need for users to set up common variables, panels or queries from scratch. This can greatly enhance user satisfaction and efficiency!
