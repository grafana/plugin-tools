---
title: Get started
description: "Enable {{{yamlEscape pluginName}}} in Grafana and get it ready to use."
keywords:
  - "{{{yamlEscape pluginName}}}"
  - app
  - setup
sidebar_position: 2
---

This document explains how to set up {{{pluginName}}} so it's ready to use.

## Before you begin

Before you set up the app, ensure you have:

- **Grafana permissions:** The `Organization administrator` role. Only organization administrators can enable and configure apps.

<!-- section-brief
Fill this in: Keep the list above. Add a bullet in the same **Label:** form for each other thing the reader needs: the Grafana version from `dependencies.grafanaDependency` in `src/plugin.json`, each plugin in `dependencies.plugins` linked to its catalog page at `https://grafana.com/grafana/plugins/<id>/`, and anything `src/plugin.json` doesn't declare, such as an external service, a telemetry pipeline or a license.
-->

## Enable the app

To enable {{{pluginName}}}:

1. Click **Administration** > **Plugins and data** > **Plugins** in the left-side menu.
1. Enter `{{{pluginName}}}` in the search bar.
1. Select **{{{pluginName}}}**.
1. Click **Enable**.

<!-- section-brief
Fill this in: If `src/plugin.json` sets `"autoEnabled": true`, the app is enabled when it's installed, so remove this section. Otherwise keep the steps above and remove only this brief.
-->
{{#if hasConfigPage}}

## Configure the app

After you enable the app, configure it. For each setting, refer to [Configure](./configure.md).
{{/if}}

## Send data to {{{pluginName}}}

<!-- section-brief
Fill this in: The steps to get the data the app shows into Grafana, such as installing an agent, setting environment variables, configuring a telemetry exporter or adding a data source. Take them from the README's setup sections and from what the app queries in source. Give each step the commands or settings to copy, and say how the reader can tell the data has arrived. Change the heading if necessary to name the task, such as "Connect your cluster".

If the app works without any setup of its own, remove this section entirely.
-->

## Next steps

<!-- section-brief
Fill this in: One or two sentences on where to go once the app is set up, linking to the page most readers open first{{#if defaultFeaturePage}}, such as [{{{defaultFeaturePage.name}}}](./{{defaultFeaturePage.file}}.md){{/if}}.
-->
