---
id: expose-a-component
title: Expose a component
sidebar_label: Expose a component
description: Share functionality with other plugins by exposing a component.
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
  - lazy-loading
  - performance  
sidebar_position: 30
---

As a plugin developer, you can expose content from your app plugins to easily share functionality.

Compared to [registering your content to an extension point](./register-an-extension), when you expose a component, other plugins can use it wherever they want, instead of you needing to define which extension point you hook it into. This also means that the component needs to be more generic, as it is not targeting a specific extension point.

Read more about extensions under [key concepts](./ui-extensions-concepts.md).

## Best practices

- **Wrap your component with providers**. If you want to access any plugin-specific state in your component, make sure to wrap it with the necessary React context providers (for example, a wrapping for Redux).

- **Use lazy loading for UI extension components**. When exposing components through UI extensions, consider using lazy loading to improve initial load performance and reduce bundle size. This is especially beneficial for large components that aren't always needed. Refer to [Expose a lazy-loaded component](#expose-a-lazy-loaded-component) for implementation details.

## Expose a component from an app plugin

You can expose one or multiple components from within the same app plugin. For example:

1. Expose the component in your plugin:

```tsx title="src/module.tsx"
import pluginJson from './plugin.json';

export const plugin = new AppPlugin()
  // You can also expose multiple components from the same app plugin
  .exposeComponent({
    // Important!
    // The `id` should always be prefixed with your plugin id, otherwise it won't be exposed.
    id: `${pluginJson.id}/reusable-component/v1`,
    title: 'Reusable component',
    description: 'A component that can be reused by other app plugins.',
    component: ({ name }: { name: string }) => <div>Hello {name}!</div>,
  });
```

2. Declare the exposed component in your `plugin.json`:

```json title="src/plugin.json"
{
  ...
  "extensions": {
    "exposedComponents": [
      {
        "id": "myorg-foo-app/reusable-component/v1",
        "title": "Reusable component",
        "description": "A component that can be reused by other app plugins."
      }
    ]
  }
}
```

:::tip
For more details refer to [the API reference guide](../../reference/ui-extensions-reference/ui-extensions.md).
:::

## Expose a lazy-loaded component

You can expose a lazy-loaded component from your app plugin to share functionality with other plugins without impacting the initial load time. This is useful when the component is large or not always needed.

:::note
For lazy loading to effectively reduce the `module.js` file size, ensure that your app plugin and its routes are already lazy loaded. If the app plugin isn't lazy loaded, the exposed component code may still be statically imported elsewhere, limiting the performance benefits.
:::

To expose a lazy-loaded component:

1. Use `React.lazy` to dynamically import the component.
1. Wrap it in a `Suspense` component.
1. Finally, pass it to the `exposeComponent` method, using the same pattern described in the `exposeComponent` method.

For example:

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

### Consume a lazy-loaded component

There are no differences when consuming lazy or non-lazy components from the consumer's perspective. The `usePluginComponent` or `usePluginComponents` hook works the same way regardless of whether the component is lazy-loaded or not. 

For more information about using plugin components, refer to the [Render components in an extension point](./extension-user-render-component) documentation.

## Access plugin meta information in an exposed component

You can access metadata for the extended component. For example:

1. Update the component to access plugin meta information:

```tsx title="src/module.tsx"
import { usePluginContext } from '@grafana/runtime';
import pluginJson from './plugin.json';

export const plugin = new AppPlugin().exposeComponent({
  id: `${pluginJson.id}/reusable-component/v1`,
  title: 'Reusable component',
  description: 'A component that can be reused by other app plugins.',
  component: ({ name }: { name: string }) => {
    // This is the meta information of the app plugin that is exposing the component
    const { meta } = usePluginContext();

    return (
      <div>
        <div>Hello {name}!</div>
        <div>Version {meta.info.version}</div>
      </div>
    );
  },
});
```

2. Make sure your `plugin.json` is up to date:
<details>
<summary>src/plugin.json</summary>

```json title="src/plugin.json"
{
  ...
  "extensions": {
    "exposedComponents": [
      {
        "id": "myorg-foo-app/reusable-component/v1",
        "title": "Reusable component",
        "description": "A component that can be reused by other app plugins."
      }
    ]
  }
}
```

</details>

:::tip
For more details refer to [the API reference guide](../../reference/ui-extensions-reference/ui-extensions.md).
:::
