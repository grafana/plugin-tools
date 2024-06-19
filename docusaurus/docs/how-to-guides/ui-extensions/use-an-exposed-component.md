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

Exposed components are a way to share functionality between plugins. Use this feature when you want to share a react component with other app plugins, but you don't know or care where or under what circumstances it will be rendered.

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
