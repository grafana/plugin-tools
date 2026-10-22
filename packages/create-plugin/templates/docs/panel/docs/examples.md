---
title: Examples
description: "Worked examples of the {{{yamlEscape pluginName}}} panel."
sidebar_position: 4
---

<!-- snippet:use-example-json -->

To use an example, open your dashboard and go to **Dashboard settings** > **JSON Model**. Paste the excerpt into the `panels` array and click **Save changes**.

<!-- /snippet:use-example-json -->

<!-- section-brief
Fill this in: Show concrete examples of {{{pluginName}}} configured for real use cases. When the repo has panels of this plugin's type in `provisioning/dashboards/*.json`, take the examples from those before inventing any. Express each example as a `dashboard.json` panel excerpt: `type` and `options`, plus `fieldConfig` and `targets` when the example depends on them. Leave out `id`, `gridPos`, `pluginVersion`, datasource UIDs and timestamps - they are specific to one dashboard and hide the settings that matter. Pair each example with a screenshot of the rendered visualization. Only use a screenshot that the example's JSON produces: open the image and check that what it shows, such as the legend, the values and the number of series, matches the JSON. If no image matches, leave the example without one and flag it. Don't cut settings from an excerpt that its result depends on, such as some of the overrides behind a screenshot.

If the repo ships a complete dashboard, for example under `provisioning/dashboards/`, link to it for readers who want the full JSON. Use the file's `https://` URL in your repository - relative links can't point outside the docs folder.
-->

## Basic example

A panel excerpt in dashboard JSON has this shape:

```json
{
  "type": "{{pluginId}}",
  "options": {},
  "targets": []
}
```

<!-- section-brief
Fill this in: Complete the excerpt above as the minimum viable {{{pluginName}}} configuration: the smallest `panels[]` entry that produces a meaningful visualization. Include only the settings it needs, plus a sample query in `targets` if the panel reads data. If the panel doesn't read data, remove `targets` from the excerpt. Pair with a screenshot of the result.
-->

## Common variations

<!-- section-brief
Fill this in: Show 1-3 alternate configurations that cover the most common ways dashboard authors use {{{pluginName}}} - different data shapes, option combinations, or display modes. Each variation is an excerpt showing only the settings that differ from the basic example, plus a screenshot. Explain in one line what each variation demonstrates.
-->
