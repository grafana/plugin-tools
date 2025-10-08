---
id: expose-a-lazy-loaded-component
title: Expose a lazy-loaded component
sidebar_label: Expose a lazy-loaded component
description: Expose a lazy-loaded component to share functionality with other plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
  - lazy-loading
sidebar_position: 31
---

You can expose a lazy-loaded component from your app plugin to share functionality with other plugins without impacting the initial load time. This is useful when the component is large or not always needed.

## Expose a lazy-loaded component

To expose a lazy-loaded component, you can use `React.lazy` to dynamically import the component and then wrap it in a `Suspense` component before passing it to the `exposeComponent` method.

```tsx
import React, { Suspense } from 'react';
import { plugin } from './plugin';

// Lazy load your component
const MyLazyComponent = React.lazy(() => import('./MyLazyComponent'));

const SuspendedComponent = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <MyLazyComponent />
  </Suspense>
);

export const plugin = new AppPlugin().exposeComponent({
  id: `${plugin.meta.id}/my-lazy-component/v1`,
  title: 'My Lazy Component',
  description: 'A component that is loaded on demand.',
  component: SuspendedComponent,
});
```

:::note
You should use the same pattern for adding components using the `addComponent` method.
:::

## Using the lazy-loaded component

When another plugin uses your lazy-loaded component with `usePluginComponent`, Grafana will automatically handle the loading of the component. The `isLoading` flag returned by the hook will be `true` until the component is loaded.

```tsx
import React from 'react';
import { usePluginComponent } from '@grafana/runtime';

export const MyPluginPage = () => {
  const { component: MyLazyComponent, isLoading } = usePluginComponent('my-plugin/my-lazy-component/v1');

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return MyLazyComponent ? <MyLazyComponent /> : <div>Component not found</div>;
};
```
