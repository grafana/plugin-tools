---
title: "{{{yamlEscape pluginName}}} annotations"
description: "Mark events on your graphs with annotation queries from {{{yamlEscape pluginName}}}."
tags:
  - data source
  - annotations
sidebar_position: 5
---

Annotations overlay event markers on time series panels, so you can correlate events from {{{pluginName}}}, such as deployments or incidents, with the metrics on your dashboards. For general information about annotations, refer to [Annotate visualizations](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/annotate-visualizations/).

## Before you begin

- [Configure the {{{pluginName}}} data source](./configure.md).

<!-- section-brief
Fill this in: Add bullets for what the reader needs in {{{pluginName}}} before annotation queries return anything, such as read access to the data, or events stored with a timestamp. Link to the matching section of `./configure.md` for access. If there is nothing beyond the configured data source, delete only this brief.
-->

## Create an annotation query

To add an annotation query to a dashboard:

1. Navigate to **Dashboard settings** > **Annotations**.
1. Click **Add annotation query**.
1. Enter a **Name** for the annotation.
1. Select the **{{{pluginName}}}** data source.

<!-- section-brief
Fill this in: Continue the list above with the steps in the annotation editor, using its field labels in bold, and end with saving the dashboard.

First find out which annotation editor the plugin has. If the data source class sets `annotations` to an `AnnotationSupport` object with its own `QueryEditor`, such as `this.annotations = createAnnotationSupport(this)`, the plugin has a custom annotation editor, so describe its fields here and its options under Annotation editor. If it sets `annotations = {}` or doesn't set it at all, Grafana uses the panel query editor followed by its standard field mapping, so link to `./query-editor.md` instead of repeating its fields.
-->

## Annotation editor

<!-- section-brief
Fill this in: Describe the custom annotation editor, from the `QueryEditor` set on `annotations` in the data source class. Add an H3 for each annotation type or preset it offers, saying when to use it, its fields and the query it generates. Say whether the generated query can be edited, and how the editor differs from the panel query editor. Also check `prepareAnnotation` and `processEvents` for behaviour the reader sees, such as defaults or how results become annotations.

If the plugin has no custom annotation editor, remove this section entirely.
-->

## Query requirements

<!-- section-brief
Fill this in: Explain what an annotation query must return. With the standard field mapping, give this table and keep only the fields the plugin can return:

| Field     | Required | Description |
| --------- | -------- | ----------- |
| `time`    | Yes      |             |
| `timeEnd` | No       |             |
| `title`   | No       |             |
| `text`    | Yes      |             |
| `tags`    | No       |             |

Fields match by name. If there is no `time` field, Grafana uses the first time field, and if there is no `text` field, the first string field. A `timeEnd` field draws a region instead of a single marker. If a custom editor or `processEvents` maps fields differently, describe that mapping instead.

If the editor has several query types, add a table of which ones suit annotations and why. Then say how to keep results to the dashboard time range, such as with the `$__timeFilter` macro, and note limits such as a result cap or API rate limits, and whether ad hoc filters also apply to annotation queries.
-->

## Annotation query examples

<!-- section-brief
Fill this in: Give realistic annotation queries for the events people mark with {{{pluginName}}}, such as deployments, incidents or errors, with an H3 for each. Say what each one marks and show the query the way a reader enters it, as a code block for a query language, or as steps with field labels in bold for a builder. Use the field names and syntax the editor really accepts.

Include a region example with `timeEnd` if the plugin can return one, and an example that filters events with a dashboard variable if annotation queries interpolate variables.
-->
