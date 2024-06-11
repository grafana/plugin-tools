---
id: use-plugin-components
title: usePluginComponents()
description: This react hook can be used to fetch components that are registered to a certain extension point.
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
sidebar_position: 50
---

# `usePluginComponents(options)`

**Available in Grafana >=v11.1.0.**

This react hook can be used to fetch _components_ that are registered to a certain extension point. Component extensions can be used to render custom UI components.

```typescript
import { usePluginComponents } from '@grafana/runtime';

const { components, isLoading } = usePluginComponents({
  extensionPointId: 'grafana/user/profile/tab',
  limitPerPlugin: 1,
});
```

## Parameters

The `.usePluginComponents()` method takes a single `options` object with the following properties:

| Property               | Description                                                                                                                                                                                                                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`extensionPointId`** | A unique id to fetch link extensions for. In case you are implementing a new extension point, this is what plugins reference when registering extensions. **Plugins must prefix this with their plugin id, while core Grafana extensions points have to use a `"grafana/"` prefix.** <br /> _E.g.: `"grafana/user/profile/tab"`_ |
| **`limitPerPlugin?`**  | _(Optional)_ - The maximum number of extensions to return per plugin. Default is no limit.                                                                                                                                                                                                                                       |

## Return value

The hook returns the following object (for more info check [`PluginExtensionComponent`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L35)):

```typescript
const {
  // An empty array if no plugins have registered extensions for this extension point yet
  components: PluginExtensionComponent[];

  // `true` until any plugins extending this extension point
  // are still loading
  isLoading: boolean;
} = usePluginComponents(options);
```

## Examples

- [Best practices for rendering components added by plugins](../../tutorials/ui-extensions/create-an-extension-point.md#best-practices-for-rendering-components)
- [Pass data to the components using props](../../tutorials/ui-extensions/create-an-extension-point.md#passing-data-to-the-components)
- [Limit which plugins can register components to your extension point](../../tutorials/ui-extensions/create-an-extension-point.md#limit-which-plugins-can-register-components)
