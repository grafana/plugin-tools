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
  - performance
sidebar_position: 31
---

You can expose a lazy-loaded component from your app plugin to share functionality with other plugins without impacting the initial load time. This is useful when the component is large or not always needed.

:::note
For lazy loading to effectively reduce the module.js file size, ensure that your app plugin and its routes are already lazy loaded. If the app plugin isn't lazy loaded, the exposed component code may still be statically imported elsewhere, limiting the performance benefits.
:::

## Expose a lazy-loaded component

To expose a lazy-loaded component, you can use `React.lazy` to dynamically import the component and then wrap it in a `Suspense` component before passing it to the `exposeComponent` method.

```tsx
import React, { Suspense } from 'react';
import { AppPlugin } from '@grafana/runtime';

// Lazy load your component
const MyLazyComponent = React.lazy(() => import('./MyLazyComponent'));

const SuspendedComponent = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <MyLazyComponent />
  </Suspense>
);

export const plugin = new AppPlugin().exposeComponent({
  id: 'my-plugin/my-lazy-component/v1',
  title: 'My Lazy Component',
  description: 'A component that is loaded on demand.',
  component: SuspendedComponent,
});
```

:::note
You should use the same pattern for adding components using the `addComponent` method.
:::

## Using the lazy-loaded component

There are no differences in consuming lazy vs non-lazy components from the consumer's perspective. The `usePluginComponent` or `usePluginComponents` hook works the same way regardless of whether the component is lazy loaded or not. For more information about using plugin components, refer to the [Render components in an extension point](./extension-user-render-component) documentation.
