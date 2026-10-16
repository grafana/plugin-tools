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

Macros are expanded in the backend, in the `QueryData` handler that implements `backend.QueryDataHandler`, or in code it calls. Take the macros from there, and show the syntax exactly as a reader writes it.

If the plugin has no macros, remove this section entirely.
-->
{{/if}}

## Query examples

<!-- section-brief
Fill this in: Give realistic examples of the common query types from Query types, with an H3 for each type. If there is only one type, give examples for the jobs people use {{{pluginName}}} for instead. For each example, say what it does and show the query the way a reader enters it in the editor, using the field names and syntax the editor really accepts.

Follow each example with the query as dashboard JSON stores it, a `targets` entry in a `json` code block. Take the shape from the query model in source and from any dashboard JSON under `provisioning/dashboards/`, and replace real UIDs and credentials with placeholders. Add a screenshot of the query editor when you can capture one, saved under `img/`. Never link an image that doesn't exist.
-->
