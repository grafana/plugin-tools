---
title: "{{{yamlEscape pluginName}}} query editor"
description: "Build and run queries with the {{{yamlEscape pluginName}}} query editor."
sidebar_position: 3
---

This document explains how to use the {{{pluginName}}} query editor to build queries and visualize {{{pluginName}}} data in Grafana dashboards.

## Before you begin

- [Configure the {{{pluginName}}} data source](./configure.md).

<!-- section-brief
Fill this in: Keep the bullet above. Add a bullet for each other thing a reader needs before writing a query, such as a feature to enable on the target service or a query language to know. If there is nothing else, delete only this brief.
-->

## Query types

<!-- section-brief
Fill this in: Describe the ways the editor builds queries, with an H3 for each one: editor modes such as a builder and a code editor, the query types or APIs it can query, and the result formats it returns, such as time series, table, logs or traces. Say when to use each. Take them from the query editor component and the query model in source, and leave out anything the editor offers only one of.

If the editor has one mode, one query type and one result format, remove this section entirely.
-->
{{#if hasBackend}}

## Macros

<!-- section-brief
Fill this in: A table of every macro the plugin expands in queries, such as `$__timeFilter`, with this shape:

| Macro | Description | Example |
| ----- | ----------- | ------- |

Take the macros from where source interpolates them, and show the syntax exactly as a reader writes it.

If the plugin has no macros, remove this section entirely.
-->
{{/if}}

## Query examples

<!-- section-brief
Fill this in: Give a few realistic queries for the jobs people use {{{pluginName}}} for. For each one, write a short heading or sentence saying what it does, then the query in a code block with the right language. Use the field names and syntax the editor really accepts.
-->
