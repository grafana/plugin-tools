---
title: Troubleshooting
description: "Troubleshoot common {{{yamlEscape pluginName}}} connection, authentication and query errors."
tags:
  - data source
  - troubleshooting
sidebar_position: 8
---

This page explains how to fix common issues when you configure or use the {{{pluginName}}} data source. For setup instructions, refer to [Configure the {{{pluginName}}} data source](./configure.md).

<!-- section-brief
Fill this in: Never guess failures. Each symptom must come from an error message in source, a known issue in the README or other docs or a reported issue.

Replace this brief with one H2 per category that has real failures, in this order:

- `## Connection errors`: Grafana can't reach the service, such as timeouts or TLS errors.
- `## Authentication errors`: wrong credentials, expired tokens or missing permissions.
- `## Query errors`: queries that fail or return no data.
- `## Template variable errors`: variables that return no or wrong values, or load slowly.
{{#if hasAnnotations}}
- `## Annotation errors`: annotations that don't appear, linking to [annotations](./annotations.md).
{{/if}}
{{#if hasAlerting}}
- `## Alerting errors`: alert rules that fail or don't fire, such as a query that works on a dashboard but not in an alert rule, which skips the frontend data source class. Link to [alerting](./alerting.md).
{{/if}}
{{#if hasBackend}}
- `## Private data source connect errors`: connections through PDC that fail, if the backend supports the secure SOCKS proxy.
{{/if}}
- `## Performance issues`: slow dashboards, timeouts or rate limits, and the settings that help.

Add an H2 if the backend classifies its errors, or for another feature with real failures, such as ad hoc filters.

Open each H2 with one sentence on when its errors occur. Add an H3 per symptom, named after the error message in quotes, such as `### "Password authentication failed"`, then **Symptoms:** and a **Possible causes and solutions:** table, or a numbered **Solutions:** list for a single cause.
-->

## Enable debug logging

{{#if hasBackend}}
To see more detail about an error in the Grafana server logs:

1. Set the log level to `debug` in the Grafana configuration file:

   ```ini
   [log]
   level = debug
   ```

1. Restart Grafana and reproduce the error.
1. Look for log lines with `logger=plugin.{{{pluginId}}}`.
1. Set the log level back to `info` when you're done, to keep the logs small.

{{/if}}
To see the raw request and response for a panel, open the panel editor and click **Query inspector**.

## Get additional help

If this page doesn't solve your problem:

- Search the [Grafana community forums](https://community.grafana.com/).
- If your Grafana Cloud or Grafana Enterprise plan includes support, contact Grafana Support.

<!-- section-brief
Fill this in: Add links to the plugin's issue tracker and the service's docs to the list above.
-->

When you report an issue, include:

- The Grafana and plugin versions.
- The error message, with sensitive information removed.
- The steps to reproduce the issue.
- The relevant data source settings, with credentials removed.
