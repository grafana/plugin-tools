---
title: "{{{yamlEscape pluginName}}} query editor"
description: "Build and run queries with the {{{yamlEscape pluginName}}} query editor."
tags:
  - data source
  - query editor
  - queries
sidebar_position: 3
---

This document explains how to use the {{{pluginName}}} query editor to build queries and visualize {{{pluginName}}} data in Grafana dashboards.

## Before you begin

- [Configure the {{{pluginName}}} data source](./configure.md).

<!-- section-brief
Fill this in: Keep the bullet above. Add a bullet for each other thing a reader needs before writing a query, such as read access to the data they query, a feature to enable on the target service or a query language to know. For access, link to the matching section of [configure](./configure.md). If there is nothing else, delete only this brief.
-->

## Editor modes

<!-- section-brief
Fill this in: An H3 for each mode the editor offers, such as a builder and a code editor, named as the editor names them. Say what each is for and when to use it, and how to switch between them. Add a screenshot of each mode when you can capture one, saved under `img/`. Never link an image that doesn't exist.

If the editor has one mode, remove this section entirely.
-->

## Query types

<!-- section-brief
Fill this in: Document the fields the editor shows, in tables with this shape:

| Field | Description |
| ----- | ----------- |

Use the field labels from the editor, in bold, and say which fields are required and their defaults and limits. If the editor has several query types or APIs, put the fields every type shares in a table first, then an H3 for each type that says when to use it and lists its own fields. Mention any shortcut that runs the query, such as **Shift+Enter**. Take the fields from the query editor component and the query type in source.

If the editor has one query type, skip the H3s, give one table of its fields and rename the heading to "Query fields".
-->

## Format the query results

<!-- section-brief
Fill this in: Describe each result format the editor can return, such as time series, table, logs or traces, and say when to use each. For each format, say what the query must return for Grafana to show it, such as a `time` column plus at least one numeric column, sorted by time, and the column order that produces several series. Take the formats from the query editor and the code that builds data frames in source.

If the editor has one result format, describe what the query must return in a paragraph without listing formats.
-->
{{#if hasBackend}}

## Macros

<!-- section-brief
Fill this in: A table of every macro the plugin expands in queries, such as `$__timeFilter`, with this shape:

| Macro | Description | Example |
| ----- | ----------- | ------- |

Macros are expanded in the backend, in the `QueryData` handler that implements `backend.QueryDataHandler`, or in code it calls. Take the macros from there, and show the syntax exactly as a reader writes it. Start with one example query that uses a macro. If a standard Grafana macro such as `$__timeGroup` doesn't work with this service, add a `> [!WARNING]` callout saying what to use instead.

If the plugin has no macros, remove this section entirely.
-->
{{/if}}

## Query examples

<!-- section-brief
Fill this in: Give realistic examples of the common query types from Query types, with an H3 for each type. If there is only one type, give examples for the jobs people use {{{pluginName}}} for instead. For each example, say what it does and show the query the way a reader enters it in the editor, using the field names and syntax the editor really accepts.

Follow each example with the query as dashboard JSON stores it, a `targets` entry in a `json` code block. Take the shape from the query model in source and from any dashboard JSON under `provisioning/dashboards/`, and replace real UIDs and credentials with placeholders.
-->
