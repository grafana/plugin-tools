---
title: Data formats
description: Learn what data formats the {{pluginName}} panel accepts.
sidebar_position: 2
---

<!-- agent-hint:start -->

Describe the data shape {{pluginName}} needs from its data source queries. Be specific about field types and structure - this is the contract dashboard authors rely on when building queries for the panel.

<!-- agent-hint:end -->

## Supported data shape

<!-- agent-hint:start -->

Describe the data frame shape {{pluginName}} expects: time series with N numeric fields, table with specific columns, single numeric value, geographic coordinates, log lines, etc. Name the required field types (time, number, string, boolean) and any minimum/maximum field counts.

<!-- agent-hint:end -->

## Field mapping

<!-- agent-hint:start -->

Explain which incoming field plays which role in the visualization - for example "the first time-typed field is the x-axis, all numeric fields become series". If {{pluginName}} lets users explicitly pick field roles in the editor, document those controls here. Remove the section if mapping is fully automatic and not user-configurable.

<!-- agent-hint:end -->
