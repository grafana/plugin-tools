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

1. Use the exposed component in your code:

```tsx title="src/components/MyComponent.tsx"
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

2. Declare the component dependency in your `plugin.json`:

```json title="src/plugin.json"
{
  ...
  "dependencies": {
    "extensions": {
      "exposedComponents": ["myorg-basic-app/reusable-component/v1"]
    }
  }
}
```

:::tip
For more details [check the API reference guide](../../reference/ui-extensions-reference/ui-extensions.md).
:::

## Prerequisites

The plugin that exposes the component must also have declared it in their `plugin.json` file under the `extensions.exposedComponents` section. For more information about exposing components, see [Expose a component](./expose-a-component.md).
