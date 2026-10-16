---
title: Troubleshooting
description: "Troubleshoot common {{{yamlEscape pluginName}}} connection, authentication and query errors."
sidebar_position: 8
---

This page explains how to fix common issues when you configure or use the {{{pluginName}}} data source. For setup instructions, refer to [Configure the {{{pluginName}}} data source](./configure.md).

<!-- section-brief
Fill this in: Delete only this brief, then fill in the sections below. Open each H2 with one sentence saying when its errors occur, then add an H3 per symptom:

- Name the H3 after the error message in quotes, such as `### "Password authentication failed"`, or after what the reader sees when there's no message, such as `### Annotations don't appear`.
- Under it, list what the reader sees after **Symptoms:**.
- Then give a **Possible causes and solutions:** table with Cause and Solution columns when there are several causes, or a numbered **Solutions:** list when there's one.

Take the symptoms from error messages in the frontend and backend source and from issues reported in the repository. Document only real failures, not generic advice. If the backend prefixes or classifies its errors, add an H2 that explains the categories first. Add an H2 for any other feature with its own real failures, such as ad hoc filters or upgrading across a major version.
-->

## Connection errors

<!-- section-brief
Fill this in: Symptoms where Grafana can't reach the service, such as timeouts, refused connections, DNS or TLS errors, with the messages source returns for them.

If there are no real connection failures to document, remove this section entirely.
-->

## Authentication errors

<!-- section-brief
Fill this in: Symptoms caused by wrong credentials, expired tokens or missing permissions on the service, with the messages source returns for them, such as from the health check.

If there are no real authentication failures to document, remove this section entirely.
-->

## Query errors

<!-- section-brief
Fill this in: Symptoms when a query fails or returns nothing, such as syntax errors, unknown fields or "No data". Include the query validation messages from source, and say how to check the time range and filters when a query returns no data.

If there are no real query failures to document, remove this section entirely.
-->

## Template variable errors

<!-- section-brief
Fill this in: Symptoms such as a variable that returns no values, shows the wrong values or is slow to load, with causes and fixes.

If the plugin doesn't support template variables, or there are no real failures to document, remove this section entirely.
-->
{{#if hasAnnotations}}

## Annotation errors

<!-- section-brief
Fill this in: Symptoms such as annotations that don't appear or too many annotations, with the annotation query fields that fix them. Link to [annotations](./annotations.md).

If there are no real annotation failures to document, remove this section entirely.
-->
{{/if}}
{{#if hasAlerting}}

## Alerting errors

<!-- section-brief
Fill this in: Symptoms where an alert rule fails to evaluate or doesn't fire. Cover a query that works on a dashboard but fails in an alert rule, since alert rules skip the frontend data source class, tabular results with no **Reduce** expression, and rate limits from frequent evaluation. Link to [alerting](./alerting.md).

If there are no real alerting failures to document, remove this section entirely.
-->
{{/if}}
{{#if hasBackend}}

## Private data source connect errors

<!-- section-brief
Fill this in: Symptoms when connecting through private data source connect (PDC), such as the toggle missing from the config editor, connections that fail only when a PDC network is selected, and host names that don't resolve from the PDC agent's network. Link to the Private data source connect section in [configure](./configure.md).

Keep this section only if the backend supports the secure SOCKS proxy. Otherwise, remove it entirely.
-->
{{/if}}

## Performance issues

<!-- section-brief
Fill this in: Symptoms such as slow dashboards, query timeouts or rate limits from the service, and the settings or query changes that fix them. Name any timeout, limit or cache setting from the config editor.

If there are no real performance issues to document, remove this section entirely.
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
Fill this in: Add bullets to the list above that link to the plugin repository's issue tracker and to the service's own documentation. Take the repository URL from `package.json` or the `info.links` in `src/plugin.json`.
-->

When you report an issue, include:

- The Grafana and plugin versions.
- The error message, with sensitive information removed.
- The steps to reproduce the issue.
- The relevant data source settings, with credentials removed.
