---
id: use-an-exposed-component
title: Use an exposed component
description: Reuse functionality from other plugins by using exposed components.
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
sidebar_position: 30
---

App plugins can [expose additional functionality through a React component](./expose-a-component.md) which can then be imported into your own plugin. Use exposed components to augment your own app plugin with additional features to extend a user workflow.

## Use an exposed component

The following example shows how to use a component exposed by another plugin:

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
