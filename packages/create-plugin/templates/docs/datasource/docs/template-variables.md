---
title: "{{{yamlEscape pluginName}}} template variables"
description: "Use template variables with {{{yamlEscape pluginName}}} to build dynamic, reusable dashboards."
tags:
  - data source
  - template variables
sidebar_position: 4
---

Use template variables to create dynamic, reusable dashboards that let you change query parameters without editing individual panels. For general information about template variables, refer to [Templates and variables](https://grafana.com/docs/grafana/latest/dashboards/variables/).

<!-- section-brief
Fill this in: Delete only this brief.

If the plugin supports no variable types and interpolates no variables in its queries, delete this page and its link in `index.md`.
-->

## Before you begin

- [Configure the {{{pluginName}}} data source](./configure.md).
- Understand [Grafana template variables](https://grafana.com/docs/grafana/latest/dashboards/variables/).
- Know how to write queries in the [{{{pluginName}}} query editor](./query-editor.md).

## Supported variable types

The {{{pluginName}}} data source supports the following variable types:

<!-- section-brief
Fill this in: A table with a Yes or No for each variable type, in this order:

| Variable type  | Supported |
| -------------- | --------- |
| Query          |           |
| Custom         | Yes       |
| Data source    | Yes       |
| Ad hoc filters |           |

Custom and Data source variables are handled by Grafana itself and work with every data source, so keep them as Yes. Query is Yes if the data source class sets `variables` or implements `metricFindQuery`. Ad hoc filters is Yes if it implements both `getTagKeys` and `getTagValues`.
-->

## Use variables in queries

<!-- section-brief
Fill this in: Explain how to use a variable in the {{{pluginName}}} query editor, field by field, since fields accept variables in different ways. For each field that accepts one, say how the reader adds it: picked from a drop-down that lists dashboard variables, perhaps with a prefix such as `var:`, or typed into an input or code editor as `$variable` or `${variable}`. Note fields that don't accept variables, and any difference between editor modes, such as a builder and a code editor. Give an example, and say how a single value is substituted, such as whether a string needs quotes. Say which Grafana global variables, such as `$__interval` or `$__from`, work and in which fields.

Find which fields list variables in the query editor component, usually from `getTemplateSrv().getVariables()`, and which fields are interpolated in `applyTemplateVariables` or `interpolateVariablesInQueries`, or in the backend.

If the plugin doesn't interpolate variables in its queries, remove this section entirely.
-->

## Query variables

A query variable fills its drop-down by running a query against {{{pluginName}}}, so its options stay current with your data. Use one to let viewers pick a value, such as a host, a table or a project, and update every panel that uses it.

To create a query variable:

1. Navigate to **Dashboard settings** > **Variables**.
1. Click **Add variable**.
1. Select **Query** as the variable type.
1. Select the **{{{pluginName}}}** data source.

<!-- section-brief
Fill this in: Continue the list above with the steps for the variable query editor, using its field labels in bold. Say whether it's the same editor as the query editor or a separate one, from the variable support in source.

If the variable query editor has several query types, such as projects or environments, add an H3 for each that says what it lists, its fields and which part of each result becomes the display text and which the value. Otherwise, explain how the query result becomes the options: which column becomes the display text and which the value, and whether columns are matched by name, such as `text` and `value`, or by position, with one example for a single column and one for separate text and value. Take this from `metricFindQuery` or the variable support class in source.

If the plugin doesn't support query variables, remove this whole section, including its heading and the text above.
-->
