---
id: extension-points
title: Extension points in Grafana
description: Available extension points in Grafana.
keywords:
  - grafana
  - plugins
  - documentation
  - plugin.json
  - UI extensions
  - extension points
sidebar_position: 50
---

Use the [`PluginExtensionPoints`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L121) enum exposed by the `@grafana/data` package to access the extension points within Grafana. 

```typescript
import { PluginExtensionPoints } from '@grafana/data';

const extensionPointId = PluginExtensionPoints.DashboardPanelMenu;
```

The following Extension Points are available:

| Extension Point ID                | Type      | Description                                                          |
| --------------------------------- | --------- | -------------------------------------------------------------------- |
| **`AlertingAlertingRuleAction`**  | Link      | Extend the alert rule menu with custom actions for alerting rules.   |
| **`AlertingHomePage`**            | Component | Extend the alerting home page with custom alert-creation experience. |
| **`AlertingRecordingRuleAction`** | Link      | Extend the alert rule menu with custom actions for recording rules.  |
| **`AlertInstanceAction`**         | Link      | Extend the alert instances table with custom actions.                |
| **`CommandPalette`**              | Link      | Extend the command palette with custom actions.                      |
| **`DashboardPanelMenu`**          | Link      | Extend the panel menu with custom actions.                           |
| **`ExploreToolbarAction`**        | Link      | Extend the "Add" button on the Explore page with custom actions.     |
| **`UserProfileTab`**              | Component | Extend the user profile page with custom tabs.                       |

