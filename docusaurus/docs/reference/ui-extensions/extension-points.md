---
id: extension-points
title: Extension points
description: A list of available extension points within Grafana that can be extended by plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
sidebar_position: 0
---

# Extension points in Grafana

A list of available extension points within Grafana that can be extended by plugins. All these extension point ids can be accessed using the [`PluginExtensionPoints` enum exposed by the `@grafana/data`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L121) package.

```typescript
import { PluginExtensionPoints } from '@grafana/data';

const extensionPointId = PluginExtensionPoints.DashboardPanelMenu;
```

We currently have the following extension points available on the [`PluginExtensionPoints`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L121) enum:

| Property                          | Type      | Description                                                          |
| --------------------------------- | --------- | -------------------------------------------------------------------- |
| **`AlertingAlertingRuleAction`**  | Link      | Extend the alert rule menu with custom actions.                      |
| **`AlertingHomePage`**            | Component | Extend the alerting home page with custom alert-creation experience. |
| **`AlertingRecordingRuleAction`** | Link      | Extend the alert rule menu with custom actions.                      |
| **`AlertInstanceAction`**         | Link      | Extend the alert instances table with custom actions.                |
| **`CommandPalette`**              | Link      | Extend the command palette with plugin specific actions.             |
| **`DashboardPanelMenu`**          | Link      | Extend the panel menu with plugin specific actions.                  |
| **`ExploreToolbarAction`**        | Link      | Extend the "Add" button on the Explore page with custom actions.     |
| **`UserProfileTab`**              | Component | Extend the user profile page with custom tabs.                       |
