---
title: Alerting
description: "Create Grafana alert rules from {{{yamlEscape pluginName}}} queries."
keywords:
  - "{{{yamlEscape pluginName}}}"
  - data source
  - alerting
sidebar_position: 6
---

You can create alert rules that run {{{pluginName}}} queries on a schedule and fire when the result meets a condition, such as a value above a threshold. For general information about alerting, refer to [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/).

## Before you begin

- [Configure the {{{pluginName}}} data source](./configure.md).

<!-- section-brief
Fill this in: Add bullets for what the reader needs in {{{pluginName}}} for alert queries to return data, such as read access, linking to `./configure.md`. If there is nothing to add, delete only this brief.
-->

## Query requirements

<!-- section-brief
Fill this in: Explain that a query must return numeric data: a time series reduced with **Reduce**, or a single numeric row. Say how to get a number otherwise, such as an aggregate or a **Count** over rows, and that each series becomes its own alert instance.

If there are several query types, add a table of which work in alert rules. Alert rules run on the backend, so frontend-only query types don't. Mention the time filter macro, such as `$__timeFilter`.
-->

## Create an alert rule

To create an alert rule from a {{{pluginName}}} query:

1. Navigate to **Alerting** > **Alert rules**.
1. Click **New alert rule**.
1. Enter a **Name** for the rule.
1. Select the **{{{pluginName}}}** data source.

<!-- section-brief
Fill this in: Continue the list with the query step, field labels in bold, then **Reduce** and **Threshold** expressions, evaluation behavior, labels and notifications, and saving. Link to `./query-editor.md` for the fields and to [Create a Grafana-managed alert rule](https://grafana.com/docs/grafana/latest/alerting/configure-alert-rules/create-grafana-managed-rule/) for the rest.
-->

## Limitations

<!-- section-brief
Fill this in: Add an H3 for each thing that works on a dashboard but not in an alert rule, and what to do instead. Alert rules skip the frontend data source class, so check `applyTemplateVariables`, `query()` overrides and ad hoc filters. Also check for auth that needs a signed-in user, such as forwarded OAuth, settings such as a row limit and API rate limits.

If nothing applies, remove this section entirely.
-->

## Alert query examples

<!-- section-brief
Fill this in: Add an H3 for each realistic alert, such as on error counts or latency. Say what it watches for, show the query as a code block or as builder steps with field labels in bold, and end with the **Reduce** function and **Threshold** to use.

Where it fits, add a no-data alert and one that combines two queries with a **Math** expression.
-->
