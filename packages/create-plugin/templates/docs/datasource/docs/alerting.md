---
title: "{{{yamlEscape pluginName}}} alerting"
description: "Create Grafana alert rules from {{{yamlEscape pluginName}}} queries."
sidebar_position: 6
---

You can create alert rules that run {{{pluginName}}} queries on a schedule and fire when the result meets a condition, such as a value above a threshold. For general information about alerting, refer to [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/).

## Before you begin

- [Configure the {{{pluginName}}} data source](./configure.md).

<!-- section-brief
Fill this in: Add bullets for what the reader needs in {{{pluginName}}} before alert queries return data, such as read access to the data the rule queries. Link to the matching section of `./configure.md` for access. If there is nothing beyond the configured data source, delete only this brief.
-->

## Query requirements

<!-- section-brief
Fill this in: Explain what a query must return for Grafana to evaluate it: numeric data, either a time series reduced to one value with a **Reduce** expression, or a single numeric row. Say how to make a result numeric when it isn't, such as an aggregate in the query or a **Count** reduction over rows. Note that a query returning several series creates one alert instance per series.

If the editor has several query types or modes, add a table of which ones work in alert rules and how. Alert rules run on the backend, so a query type handled only in the frontend data source class can't be used. Then say how to keep results to the evaluation window, such as with the `$__timeFilter` macro.
-->

## Create an alert rule

To create an alert rule from a {{{pluginName}}} query:

1. Navigate to **Alerting** > **Alert rules**.
1. Click **New alert rule**.
1. Enter a **Name** for the rule.
1. Select the **{{{pluginName}}}** data source.

<!-- section-brief
Fill this in: Continue the list above with the query step, using the query editor's field labels in bold, then adding a **Reduce** and a **Threshold** expression, setting the evaluation behavior, adding labels and notifications and saving the rule. Link to `./query-editor.md` instead of repeating its fields, and to [Create a Grafana-managed alert rule](https://grafana.com/docs/grafana/latest/alerting/configure-alert-rules/create-grafana-managed-rule/) for the generic steps.
-->

## Limitations

<!-- section-brief
Fill this in: List what works on a dashboard but not in an alert rule, with an H3 for each and what to do instead. Alert rules send queries straight to the backend, so look in source for anything the frontend data source class does to a query first, such as `applyTemplateVariables`, an override of `query()` or ad hoc filters, since dashboard variables and ad hoc filters aren't applied. Also look for auth that needs a signed-in user, such as a forwarded OAuth token, settings that change results, such as a row limit, and API rate limits or timeouts that delay evaluation.

If nothing applies, remove this section entirely.
-->

## Alert query examples

<!-- section-brief
Fill this in: Give realistic alert queries for the conditions people watch with {{{pluginName}}}, such as error counts, latency or usage, with an H3 for each. Say what each one watches for and show the query the way a reader enters it, as a code block for a query language, or as steps with field labels in bold for a builder. End each with the **Reduce** function and **Threshold** to use. Use the field names and syntax the editor really accepts.

Where it fits, include an example that alerts on missing data with **Configure no data and error handling**, and one that combines two queries with a **Math** expression, such as an error rate.
-->
