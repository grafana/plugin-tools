---
title: Template variables
description: "Use template variables with {{{yamlEscape pluginName}}} to build dynamic, reusable dashboards."
sidebar_position: 4
---

<!-- section-brief
Fill this in: Say in one or two sentences what this page covers: filling dashboard variables from {{{pluginName}}} and using variables in its queries. Link to https://grafana.com/docs/grafana/latest/dashboards/variables/ for how variables work in general.

If the plugin supports no variable types and interpolates no variables in its queries, delete this page and its link in `index.md`.
-->

## Supported variable types

<!-- section-brief
Fill this in: A table of the variable types that work with {{{pluginName}}}, such as Query, Custom, Data source and Ad hoc filters, with a short note on each. Base it on what source implements: variable support in the data source class (`variables` or `metricFindQuery`) for Query variables, and `getTagKeys` and `getTagValues` for Ad hoc filters. Leave out types the plugin doesn't support.

If the plugin supports no variable types, remove this section entirely.
-->

## Create a query variable

<!-- section-brief
Fill this in: Numbered steps to add a query variable from Dashboard settings > Variables, then describe the fields of the variable query editor. Give example variable queries for common cases, and say which part of the result becomes the variable's value and which becomes its display text.

If the plugin doesn't support query variables, remove this section entirely.
-->

## Use variables in queries

<!-- section-brief
Fill this in: Show how to reference a variable in a query with `$variable` or `${variable}`, with an example. Explain how multi-value variables and the **All** option are handled, and which formats such as `${variable:singlequote}` are useful for this data source. Base it on how source interpolates variables (`applyTemplateVariables` or `interpolateVariablesInQueries`), including which query fields are interpolated.

If the plugin doesn't interpolate variables in its queries, remove this section entirely.
-->
