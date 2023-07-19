---
id: migrate-10.0.x-to-10.1.x
title: 10.0.x to 10.1.x
sidebar_position: 690
---

# Migrate plugins from Grafana version 10.0.x to 10.1.x

## Accessibility update for IconButton component in grafana-ui

We updated the component's TypeScript interface due to an accessibility issue. This change was delivered to the core `grafana` repo with [PR 69699](https://github.com/grafana/grafana/pull/69699).

In case you are using the IconButton component in your plugin you will get TypeScript errors related to the change.

**Recommended actions:**

- Review use cases of IconButton in your plugin.
- Add a meaningful tooltip which the component will also use as an aria-label.
- Another option is to set an aria-label. In this case a tooltip will not be shown.

**Please note:**
The IconButton used to have a property called `ariaLabel` which got deprecated with this change. You can now use the regular property `aria-label` instead.
