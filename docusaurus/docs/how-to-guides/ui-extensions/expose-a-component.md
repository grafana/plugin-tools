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
sidebar_position: 30
---

As a content provider, you can expose components from your app plugins to easily share functionality.

Compared to [registering an extension](./register-an-extension), when you expose a component, other plugins can use it wherever they want, instead of you needing to define which extension point you hook it into. This also means that the component needs to be more generic, as it is not targeting a specific extension point.

## Best practices

- **Wrap your component with providers** - if you want to access any plugin-specific state in your component, make sure to wrap it with the necessary React context providers (for example, a wrapping for Redux).

## Expose a component from an app plugin

You can expose one or multiple components from within the same app plugin. For example:

```tsx
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

:::tip
For more details [check the API reference guide](../../reference/ui-extensions-reference/ui-extensions.md).
:::

## Access plugin meta information in an exposed component

You can access metadata for the extended component. For example:

```tsx
import { usePluginContext } from "@grafana/runtime";
import pluginJson from './plugin.json';

export const plugin = new AppPlugin()
  .exposeComponent({
    id: `${pluginJson.id}/reusable-component/v1`,
    title: 'Reusable component',
    description: 'A component that can be reused by other app plugins.',
    component: ({ name }: { name: string }) => {
      // This is the meta information of the app plugin that is exposing the component
      const { meta } = usePluginContext();

      return (
        <div>Hello {name}!</div>
        <div>Version {meta.info.version}</div>
      );
    }
  })
```

:::tip
For more details [check the API reference guide](../../reference/ui-extensions-reference/ui-extensions.md).
:::