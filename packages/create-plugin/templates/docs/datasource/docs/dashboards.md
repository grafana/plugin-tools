---
title: Dashboards
description: "Import and use the dashboards that ship with {{{yamlEscape pluginName}}}."
sidebar_position: 7
---

{{{pluginName}}} ships with ready-made dashboards that you can import and use as they are, or as a starting point for your own. For general information about dashboards, refer to [Dashboards](https://grafana.com/docs/grafana/latest/dashboards/).

## Import a dashboard

To import a dashboard that ships with {{{pluginName}}}:

1. Click **Connections** > **Data sources** in the left-side menu.
1. Select your {{{pluginName}}} data source.
1. Click the **Dashboards** tab.
1. Click **Import** next to the dashboard.

Imported dashboards don't update when you upgrade the plugin. To get a newer version, click **Re-import** next to the dashboard. This overwrites any changes you made to it.

## Included dashboards

<!-- section-brief
Fill this in: One H3 per dashboard in the `includes` list of `src/plugin.json` whose `type` is `dashboard`, using its `name`. For each one, describe what it shows and what data or settings it needs to work, based on the panels and queries in its JSON file.
-->
