---
id: use-plugin-links
title: usePluginLinks()
description: This react hook can be used to fetch links that are registered to a certain extension point.
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
sidebar_position: 40
---

# `usePluginLinks(options)`

:::info
Available in Grafana >=v11.1.0.
:::

This react hook can be used to fetch links that are registered to a certain extension point. Plugins can register links using the [`AppPlugin.addLink()`](./addLink.md) method.

```typescript
import { usePluginLinks } from '@grafana/runtime';

const { links, isLoading } = usePluginLinks({
  extensionPointId: 'grafana/dashboard/panel/menu',
  limitPerPlugin: 2,
  context: {
    panelId: '...',
  },
});
```

## Parameters

The `.usePluginLinks()` method takes a single `options` object with the following properties:

| Property               | Description                                                                                                                                                                                                                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`extensionPointId`** | A unique id to fetch link extensions for. In case you are implementing a new extension point, this is what plugins reference when registering extensions. **Plugins must prefix this with their plugin id, while core Grafana extensions points have to use a `"grafana/"` prefix.** <br /> _Example: `"grafana/dashboard/panel/menu"`_ |
| **`context?`**         | _(Optional)_ - An arbitrary object that you would like to share with the extensions. This can be used to pass data to the extensions.                                                                                                                                                                                                   |
| **`limitPerPlugin?`**  | _(Optional)_ - The maximum number of extensions to return per plugin. Default is no limit.                                                                                                                                                                                                                                              |

## Return value

The hook returns the following object (for more info check [`PluginExtensionLink`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L27)):

```typescript
const {
  // An empty array if no plugins have registered extensions for this extension point yet
  links: PluginExtensionLink[];

  // `true` until any plugins extending this extension point
  // are still loading
  isLoading: boolean;
} = usePluginLinks(options);
```

## Examples

- [Pass data to the links](../../tutorials/ui-extensions/create-an-extension-point.md#passing-data-to-links)
- [Limit the number of links by plugins](../../tutorials/ui-extensions/create-an-extension-point.md#limit-the-number-of-extensions-by-plugins)
- [Limit which plugins can register links to your extension point](../../tutorials/ui-extensions/create-an-extension-point.md#limit-which-plugins-can-register-links)

## See also

- [Best practices for rendering links added by plugins](../../tutorials/ui-extensions/create-an-extension-point.md#best-practices-for-rendering-links)
