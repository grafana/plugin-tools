---
id: enable-for-annotations
title: Enable annotations
description: Add support for annotations in your plugin.
keywords:
  - grafana
  - plugins
  - plugin
  - annotations
---

# Enable annotations

You can add support to your plugin for annotations that will insert information into Grafana alerts. This guide explains how to add support for [annotations](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/annotate-visualizations/) to a data source plugin.

## Support annotations in your data source plugin

To enable annotations, simply add two lines of code to your plugin. Grafana uses your default query editor for editing annotation queries.

1. Add `"annotations": true` to the [plugin.json](../../metadata.md) file to let Grafana know that your plugin supports annotations.

   ```json title="src/plugin.json"
   {
     "annotations": true
   }
   ```

2. In `datasource.ts`, override the `annotations` property from `DataSourceApi` (or `DataSourceWithBackend` for backend data sources). For the default behavior, set `annotations` to an empty object.

   ```ts title="src/datasource.ts"
   annotations: {
   }
   ```
