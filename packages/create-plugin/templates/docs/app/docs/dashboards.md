---
title: Dashboards
description: "Import and use the dashboards that ship with {{{yamlEscape pluginName}}}."
keywords:
  - "{{{yamlEscape pluginName}}}"
  - app
  - dashboards
sidebar_position: 6
---

{{{pluginName}}} ships with ready-made dashboards that you can import and use as they are, or as a starting point for your own. For general information about dashboards, refer to [Dashboards](https://grafana.com/docs/grafana/latest/dashboards/).

## Import a dashboard

<!-- snippet:import-app-dashboard -->

To import a dashboard that ships with {{{pluginName}}}:

1. Click **Administration** > **Plugins and data** > **Plugins** in the left-side menu.
1. Enter `{{{pluginName}}}` in the search bar.
1. Select **{{{pluginName}}}**.
1. Click the **Dashboards** tab.
1. Click **Import** next to the dashboard.

Imported dashboards don't update when you upgrade the plugin. When a plugin upgrade ships a newer version of a dashboard, click **Update** next to it. This overwrites any changes you made to it.

<!-- /snippet:import-app-dashboard -->

## Included dashboards

<!-- section-brief
Fill this in: One H3 per dashboard in the `includes` list of `src/plugin.json` whose `type` is `dashboard`, using its `name`. For each one, describe what it shows and what data or settings it needs to work, based on the panels and queries in its JSON file. When the app ships many dashboards, group related ones under a shared H3 and list them, rather than repeating the same description.
-->
