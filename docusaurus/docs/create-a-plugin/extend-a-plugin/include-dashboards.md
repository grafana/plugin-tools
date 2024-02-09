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

App and datasource plugins can include dashboards making it easy for users to get started with a plugin with minimal effort. Rather than expect users to create dashboards from scratch, we can bundle ready made dashboards with common queries and visualisations so they can make the most of a plugin. In this guide we'll show you how to include pre-built dashboards with datasource and app plugins.

## Create a dashboard

First, create the dashboard you want to include. You can use the development environment provided by create-plugin. Below we outline the steps along with suggestions on how best to build the dashboard.

### Datasource dashboards

#### Export the dashboard

In this step, we export the dashboard to a JSON file so it can be placed in a file along your plugin source code.

1. Navigate to your dashboard in the Grafana application
1. Click the Share icon in at the top-left of the dashboard.
1. Click **Export**.
1. Enable **Export for sharing externally**, and then click **Save to file**.

When you export a dashboard for sharing externally, Grafana adds a placeholder rather than a direct reference to the data source. That way, when the user imports the dashboard, it’ll use their data source instance instead.

### App dashboards

For app dashboards that use datasources it is recommended to first create a dashboard data source variable to allow users to reference their own datasource instances once the dashboard has been imported.

You can do this by

1. Create a datasource variable, choose a type and give it a name
1. Each panel that you create should use the datasource variable as its datasource

#### Export the dashboard

1. Navigate to your dashboard in the Grafana application
1. Click the Share icon in at the top-left of the dashboard.
1. Click **Export** and then click **Save to file**.
1. Open the dashboard json file in your code editor and set it's `id` property to `null`.

## Add the dashboard to your plugin

Now create a folder called dashboards in the src directory of your plugin and copy the exported dashboard json file from the previous step into the the dashboards folder.

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

In plugin.json, add a new dashboard resource to the includes property, where the path is the relative path to the dashboard definition within the src folder.

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
The path must be relative to the src directory. This is due to the frontend build command copying the daashboard.json file into the dist directory.
:::

Rebuild your plugin, and restart Grafana to reload the plugin configuration.

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

If you'd like your App dashboard to become a navigation link in Grafana you can add an additional page include to your package.json like so:

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

## Include dashboards for a better onboarding experience

By including ready-made dashboards with curated queries and visualizations, you can create a better onboarding experience for your users. Do users set up the same variables or panels for every new dashboard? Include a dashboard to serve as a template that they can use to scaffold a new dashboard. Your users will thank you!
