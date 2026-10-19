---
title: "{{{yamlEscape page.name}}}"
description: "Use the {{{yamlEscape page.name}}} page in {{{yamlEscape pluginName}}}."
keywords:
  - "{{{yamlEscape pluginName}}}"
  - "{{{yamlEscape page.name}}}"
sidebar_position: {{page.position}}
---

<!-- section-brief
Fill this in: One or two sentences on what the {{{page.name}}} page is for and when someone opens it. The app shows it at `{{{page.path}}}`. Pair it with a screenshot of the page if `info.screenshots` in `src/plugin.json` has one.
-->
{{#if page.role}}

## Before you begin

- **Grafana permissions:** At least the `{{page.role}}` role.

<!-- section-brief
Fill this in: Keep the bullet above. Add a bullet in the same **Label:** form only for something the reader needs before they can use this page and wouldn't guess, such as a feature flag that must be on or data that must exist. Never repeat setup from the Introduction or from another page, and don't link back to them. If this section would only point at another page, it adds nothing, so remove it, including its heading and the bullet above.
-->
{{/if}}

<!-- section-brief
Fill this in: Replace this brief with one H2 per task someone does on the {{{page.name}}} page, named after the task, such as "Filter by service" or "Compare two time ranges". Under each, give the steps with the UI labels in bold, and say what each part of the page shows when it helps the task. Find the tasks in the component that renders `{{{page.path}}}`, including its tabs and drilldowns, which `src/plugin.json` doesn't list. Describe UI that only appears behind a feature flag or a condition as "when X is enabled".
-->
