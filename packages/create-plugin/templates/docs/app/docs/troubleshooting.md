---
title: Troubleshooting
description: "Troubleshoot common {{{yamlEscape pluginName}}} setup, data and access errors."
keywords:
  - "{{{yamlEscape pluginName}}}"
  - app
  - troubleshooting
sidebar_position: 8
---

This page explains how to fix common issues when you set up or use {{{pluginName}}}. For setup instructions, refer to the [Introduction](./index.md).

<!-- section-brief
Fill this in: Never guess failures. Each symptom must come from an error or empty-state message in source, a known issue in the README or other docs or a reported issue. When source holds only a few real failures, a short page is right, so don't pad it.

Replace this brief with one H2 per category that has real failures, in this order:

- `## Setup errors`: the app won't enable, or its settings don't save or don't connect.
- `## Missing data`: pages that load but show no data, linking to the setup steps in the [Introduction](./index.md).
{{#if hasPermissions}}
- `## Permission errors`: users who can't see a page or an action, linking to [Permissions](./permissions.md).
{{/if}}
- `## Performance issues`: slow pages, timeouts or rate limits, and the settings that help.

Add an H2 for another part of the app with real failures, named after that part.

Open each H2 with one sentence on when its errors occur. Add an H3 per symptom, named after the error message in quotes, such as `### "Failed to load services"`, then **Symptoms:** and a **Possible causes and solutions:** table, or a numbered **Solutions:** list for a single cause.
-->

## Get more detail about an error

For errors in the app, open the developer tools in your browser and check the console.
{{#if hasBackend}}

<!-- snippet:server-debug-logs -->

In self-managed Grafana, the Grafana server logs show more detail:

1. Set the log level to `debug` in the Grafana configuration file:

   ```ini
   [log]
   level = debug
   ```

1. Restart Grafana and reproduce the error.
1. Look for log lines with `logger=plugin.{{{pluginId}}}`.
1. Set the log level back to `info` when you're done, to keep the logs small.

<!-- /snippet:server-debug-logs -->
{{/if}}

## Get additional help

If this page doesn't solve your problem:

- Search the [Grafana community forums](https://community.grafana.com/).
- If your Grafana Cloud or Grafana Enterprise plan includes support, contact Grafana Support.

<!-- section-brief
Fill this in: Add links to the plugin's issue tracker and the docs of any service the app depends on to the list above.
-->

When you report an issue, include:

- The Grafana and plugin versions.
- The error message, with sensitive information removed.
- The steps to reproduce the issue.
- The app page where it happens and the relevant app settings, with credentials removed.
