---
id: use-an-exposed-component
title: Use an exposed component
sidebar_label: Use exposed components
description: Reuse functionality from other plugins by using exposed components.
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
sidebar_position: 30
---

App plugins can [expose additional functionality through a React component](./expose-a-component.md), which you can then import into your own plugin. Use exposed components to augment your own app plugin with additional features to extend a user workflow.

## Use an exposed component

The following example shows how you can render a component exposed by another plugin in your extension point:

```tsx
import { usePluginComponent } from '@grafana/runtime';

export const MyComponent = () => {
  const { component: Component, isLoading } = usePluginComponent('myorg-basic-app/reusable-component/v1');

  return (
    <>
      <div>My component</div>
      {isLoading ? 'Loading...' : <Component name="John" />}
    </>
  );
};
```

:::tip
For more details [check the API reference guide](../../reference/ui-extensions-reference/ui-extensions.md).
:::

## Declare the component dependency in your plugin.json

When using an exposed component from another plugin, you must declare this dependency in your own `plugin.json` file. Add the component ID to the `dependencies.extensions.exposedComponents` array:

```json
{
  "dependencies": {
    "extensions": {
      "exposedComponents": ["myorg-basic-app/reusable-component/v1"]
    }
  }
}
```

For more information, see the [`plugin.json` reference](../../reference/metadata.md#dependenciesextensionsexposedcomponents).

## Prerequisites

The plugin that exposes the component must also have declared it in their `plugin.json` file under the `extensions.exposedComponents` section. For more information about exposing components, see [Expose a component](./expose-a-component.md).
