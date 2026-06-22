---
title: SQL macros
description: Reference for SQL macros supported by the {{pluginName}} data source.
sidebar_position: 4
---

<!-- section-brief:start -->

Reference every SQL macro {{pluginName}} supports. Macros are template placeholders that expand at query time (for example `$__timeFilter`, `$__timeGroup`). Document each one with its syntax, parameters, what it expands to and a realistic query example. Inherit the standard sqlds macros if the plugin embeds `sqlds.SQLDatasource`, plus any driver-specific macros the plugin defines on top.

<!-- section-brief:end -->

## Available macros

<!-- section-brief:start -->

For each macro, give it an H3. Include: the macro's literal name, its parameters and types, what it expands to (paste an example expansion), and a 1-line use case. Order by frequency of use (`$__timeFilter` and `$__timeGroup` first).

<!-- section-brief:end -->

## Example queries

<!-- section-brief:start -->

Show 2-3 complete queries that demonstrate the most common macro patterns: time-range filtering, time-bucketed aggregation and dynamic interval selection. Express examples in copy-pasteable SQL, not free-form prose.

<!-- section-brief:end -->
