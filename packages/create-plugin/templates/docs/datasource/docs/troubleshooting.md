---
title: Troubleshooting
description: "Troubleshoot common {{{yamlEscape pluginName}}} connection, authentication and query errors."
sidebar_position: 8
---

<!-- section-brief
Fill this in: Say in one sentence what this page covers. Use one H2 per category below and one H3 per symptom, named after what the user sees, such as the error message. Under each symptom, give the error message, its cause and the steps to fix it. Start from the error messages in the frontend and backend source and from failures reported in the repository's issues. Focus on real, observed failures - not generic advice.
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

## Performance issues

<!-- section-brief
Fill this in: Symptoms such as slow dashboards, query timeouts or rate limits from the service, and the settings or query changes that fix them. Name any timeout, limit or cache setting from the config editor.

If there are no real performance issues to document, remove this section entirely.
-->

## Enable debug logging

<!-- section-brief
Fill this in: Explain how to get more detail when an error isn't clear: set `level = debug` under `[log]` in the Grafana configuration file and find the plugin's log lines, and check the query inspector in the panel editor for the raw request and response.

If the plugin has no backend, cover only the query inspector and the browser developer tools.
-->

## Get additional help

<!-- section-brief
Fill this in: Say where to ask for help when the page doesn't solve the problem: the plugin repository's issue tracker, the Grafana community forum at https://community.grafana.com/ and, for customers, Grafana support. Say what to include in a report, such as the Grafana and plugin versions and the error message.
-->
