---
title: Data formats
description: "Learn what data formats the {{{yamlEscape pluginName}}} panel accepts."
sidebar_position: 2
---

This document explains the data the {{{pluginName}}} panel needs from a query, so you can build a matching query or check your test data.

## Supported data shape

<!-- section-brief
Fill this in: Describe the data frame shape {{{pluginName}}} expects: time series with N numeric fields, table with specific columns, single numeric value, geographic coordinates, log lines, etc. Be specific about field types and structure, because this is the contract dashboard authors rely on when building queries for the panel. Name the required field types (time, number, string, boolean) and any minimum/maximum field counts. After each shape, add a `#### Example` table whose headers are the field names the panel reads, with 3-5 rows of realistic values, so a reader can build a matching query or test data.
-->

## Field mapping

<!-- section-brief
Fill this in: Explain which incoming field plays which role in the visualization - for example "the first time-typed field is the x-axis, all numeric fields become series". If {{{pluginName}}} lets users explicitly pick field roles in the editor, document those controls here. Remove the section if mapping is fully automatic and not user-configurable.
-->

## Check what your query returns

To see the data the panel receives, open the panel editor, click **Query inspector** and select the **Data** tab. You can also turn on **Table view** at the top of the panel editor to see the data as a table.

## Reshape data that doesn't match

If a query returns data in a different shape, you can reshape it without changing the query. Select the **Transform data** tab in the panel editor and add a transformation. For more information, refer to [Transform data](https://grafana.com/docs/grafana/latest/panels-visualizations/query-transform-data/transform-data/).
