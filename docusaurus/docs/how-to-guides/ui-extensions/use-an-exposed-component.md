---
id: use-an-exposed-component
title: Use an exposed component
description: Reuse functionality from other plugins by using exposed components
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
sidebar_position: 30
---

App plugins can [expose additional functionality through a React Component](./expose-a-component.md) which can then be imported within your own plugin. Use exposed components to augment your own App plugin with additional features to extend a user workflow.

## Using an exposed component

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
