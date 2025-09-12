---
id: extensions-api-deprecated
title: UI extensions API guide (deprecated elements)
description: Reference guide for UI extensions - deprecated elements. 
keywords:
  - grafana
  - plugins
  - documentation
  - plugin.json
  - API reference
  - UI extensions
sidebar_position: 50
---

:::warning
These elements are deprecated and have been removed starting in Grafana v12.
:::

## `getPluginExtensions` 

:::warning
This function has been removed starting in Grafana version 12. Use either the [`usePluginLinks()`](./ui-extensions.md#usepluginlinks) or [`usePluginComponents()`](./ui-extensions.md#useplugincomponents) hooks instead.
:::

This function fetches extensions (both links and components) that are registered to a certain extension point.

```typescript
import { getPluginExtensions } from '@grafana/runtime';

const { extensions } = getPluginExtensions({
  extensionPointId: 'grafana/dashboard/panel/menu/v1',
  limitPerPlugin: 2,
  context: {
    panelId: '...',
  },
});
```

### Parameters

The `getPluginExtensions()` function takes a single `options` object with the following properties:

| Property       | Description          | Required |
| ---------------------- | --------------------------- | -------- |
| **`extensionPointId`** | A unique id to fetch link extensions for. In case you are implementing a new extension point, this is what plugins reference when registering extensions. **Plugins must prefix this with their plugin id, while core Grafana extensions points have to use a `"grafana/"` prefix.** <br /> _Example: `"grafana/dashboard/panel/menu/v1"`_ | true     |
| **`context?`**         | An arbitrary object that you would like to share with the extensions. This can be used to pass data to the extensions.                   | false    |
| **`limitPerPlugin?`**  | - The maximum number of extensions to return per plugin. Default is no limit.       | false    |

### Return value

The hook returns the following object:

```typescript
const {
  // An empty array if no plugins have registered extensions for this extension point yet
  extensions: PluginExtension[];
} = getPluginExtensions(options);
```

For more information, see [`PluginExtension`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L40).


## `usePluginExtensions` 

:::warning
This hook has been removed starting in Grafana version 12. Use either the [`usePluginLinks()`](./ui-extensions.md#usepluginlinks) or [`usePluginComponents()`](./ui-extensions.md#useplugincomponents) hooks instead.
:::

This react hook fetches extensions (both links and components) that are registered to a certain extension point.

```typescript
import { usePluginExtensions } from '@grafana/runtime';

const { extensions, isLoading } = usePluginExtensions({
  extensionPointId: 'grafana/dashboard/panel/menu/v1',
  limitPerPlugin: 2,
  context: {
    panelId: '...',
  },
});
```

### Parameters

The `.usePluginExtensions()` method takes a single `options` object with the following properties:

| Property               | Description        | Required |
| ---------------------- |----------------------------------------- | -------- |
| **`extensionPointId`** | A unique id to fetch link extensions for. In case you are implementing a new extension point, this is what plugins reference when registering extensions. **Plugins must prefix this with their plugin id, while core Grafana extensions points have to use a `"grafana/"` prefix.** <br /> _Example: `"grafana/dashboard/panel/menu/v1"`_ | true     |
| **`context?`**         | An arbitrary object that you would like to share with the extensions. This can be used to pass data to the extensions.                     | false    |
| **`limitPerPlugin?`**  | The maximum number of extensions to return per plugin. Default is no limit.         | false    |

### Return value

The hook returns the following object:

```typescript
const {
  // An empty array if no plugins have registered extensions for this extension point yet
  extensions: PluginExtension[];

  // `true` until any plugins extending this extension point
  // are still loading
  isLoading: boolean;
} = usePluginExtensions(options);
```

For more information, see [`PluginExtension`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L40).