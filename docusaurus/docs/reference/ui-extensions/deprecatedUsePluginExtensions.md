---
id: use-plugin-extensions
title: usePluginExtensions() ⚠️
description: This react hook can be used to fetch extensions for a certain extension point.
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
sidebar_position: 200
---

:::warning

**This hook is deprecated** and will be removed in the future (in Grafana v12).
Please use either the [`usePluginLinks()`](./usePluginLinks.md) or [`usePluginComponents()`](./usePluginComponents.md) hooks instead.

:::

# `usePluginExtensions(options)`

This react hook can be used to fetch extensions (both links and components) that are registered to a certain extension point.

```typescript
import { usePluginExtensions } from '@grafana/runtime';

const { extensions, isLoading } = usePluginExtensions({
  extensionPointId: 'grafana/dashboard/panel/menu',
  limitPerPlugin: 2,
  context: {
    panelId: '...',
  },
});
```

## Parameters

The `.usePluginExtensions()` method takes a single `options` object with the following properties:

| Property               | Description                                                                                                                                                                                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`extensionPointId`** | A unique id to fetch link extensions for. In case you are implementing a new extension point, this is what plugins reference when registering extensions. **Plugins must prefix this with their plugin id, while core Grafana extensions points have to use a `"grafana/"` prefix.** <br /> _E.g.: `"grafana/dashboard/panel/menu"`_ |
| **`context?`**         | _(Optional)_ - An arbitrary object that you would like to share with the extensions. This can be used to pass data to the extensions.                                                                                                                                                                                                |
| **`limitPerPlugin?`**  | _(Optional)_ - The maximum number of extensions to return per plugin. Default is no limit.                                                                                                                                                                                                                                           |

## Return value

The hook returns the following object (for more info check [`PluginExtension`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L40)):

```typescript
const {
  // An empty array if no plugins have registered extensions for this extension point yet
  extensions: PluginExtension[];

  // `true` until any plugins extending this extension point
  // are still loading
  isLoading: boolean;
} = usePluginExtensions(options);
```
