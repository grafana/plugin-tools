---
title: Dashboards
description: Learn about the dashboards bundled with the {{pluginName}} data source.
sidebar_position: 5
---

<!-- agent-hint:start -->

Describe every dashboard bundled with {{pluginName}}. Bundled dashboards are declared as `type: "dashboard"` entries in the `includes` array of `src/plugin.json`; each entry's `path` points at a dashboard JSON file. For each bundled dashboard, write its own H2 section covering what it shows, who it is for, and what data it expects. Source the dashboard title from the `title` field of the dashboard JSON (fall back to the `name` field in plugin.json). Screenshots strongly encouraged.

<!-- agent-hint:end -->

## Available dashboards

<!-- agent-hint:start -->

Replace this placeholder with one H2 per bundled dashboard. For each one, describe its purpose, the most useful panels it contains and the data or queries it expects. The `bootstrap-plugin-docs` skill can auto-fill these by reading the dashboard JSON files referenced from `src/plugin.json`.

<!-- agent-hint:end -->
