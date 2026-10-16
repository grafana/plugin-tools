---
title: "{{{yamlEscape pluginName}}} template variables"
description: "Use template variables with {{{yamlEscape pluginName}}} to build dynamic, reusable dashboards."
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

## Supported variable types

<!-- section-brief
Fill this in: A table of the variable types and whether {{{pluginName}}} supports each, with this shape:

| Variable type | Supported |
| ------------- | --------- |

Cover Query, Custom, Data source and Ad hoc filters. Base it on what source implements: variable support in the data source class (`variables` or `metricFindQuery`) for Query variables, and `getTagKeys` and `getTagValues` for Ad hoc filters.

If the variable query editor has its own query types, such as projects or environments, add a second table of them with the display text and the value each one returns.
-->

## Create a query variable

To create a query variable:

1. Navigate to **Dashboard settings** > **Variables**.
1. Click **Add variable**.
1. Select **Query** as the variable type.
1. Select the **{{{pluginName}}}** data source.

<!-- section-brief
Fill this in: Continue the list above with the steps for the variable query editor, using its field labels in bold. Say whether it's the same editor as the query editor or a separate one, from the variable support in source.

If the plugin doesn't support query variables, remove this section entirely.
-->

## How query results become variable options

<!-- section-brief
Fill this in: Explain how the variable query's result becomes the options in the variable drop-down: which column becomes the display text and which becomes the value, and whether columns are matched by name, such as `text` and `value`, or by position. Give one example for a single column and one for separate text and value. Take the rules from `metricFindQuery` or the variable support class in source, including any type a column must have.

If the options come from fixed entity types rather than a query result, remove this section entirely.
-->

## Use variables in queries

<!-- section-brief
Fill this in: Show how to reference a variable in a query with `$variable` or `${variable}`, with an example, and say how single values are substituted, such as whether a string needs quotes. Say which query editor fields accept variables and how variables appear in them, such as options in a drop-down. Say which Grafana global variables, such as `$__interval` or `$__from`, work and in which fields. Base it on how source interpolates variables (`applyTemplateVariables` or `interpolateVariablesInQueries`), including which query fields are interpolated.

If the plugin doesn't interpolate variables in its queries, remove this section entirely.
-->

## Chained variables

<!-- section-brief
Fill this in: Explain how to make one variable's options depend on another by referencing the first variable in the second variable's query. Give one parent and child example. Note that when the parent is multi-value, the child query may only get its first value.

If the plugin doesn't interpolate variables in variable queries, remove this section entirely.
-->

## Multi-value variables

<!-- section-brief
Fill this in: Explain how a multi-value variable expands in a query, such as `'a','b'` for an `IN` list, with an example and what it expands to. Say which format to use, such as `${variable:singlequote}`, and what the **All** option becomes. Document any macro the plugin offers for it, such as one that drops a filter when **All** is selected. Base it on how source formats multi-value variables.

If the plugin doesn't support multi-value variables, remove this section entirely.
-->

## Ad hoc filters

<!-- section-brief
Fill this in: Explain how ad hoc filters apply to {{{pluginName}}} queries: where the filter keys and values come from, how to limit them to a database or table if the plugin supports it, which operators work and any limit on the number of values. Base it on `getTagKeys`, `getTagValues` and the code that applies the filters in source.

If the plugin doesn't implement `getTagKeys` and `getTagValues`, remove this section entirely.
-->
