---
id: exposed-components
title: Exposed components
description: Share functionality between plugins with exposed components
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
sidebar_position: 30
---

Exposed components are a way to share functionality between plugins.

## Exposing a component from an app plugin

```tsx
import pluginJson from './plugin.json';

export const plugin = new AppPlugin()
  // You can also expose multiple components from the same app plugin
  .exposeComponent({
    // Important!
    // The `id` should always be prefixed with your plugin id, otherwise it won't be exposed.
    id: `${pluginJson.id}/reusable-component`,
    title: 'Reusable component',
    description: 'A component that can be reused by other app plugins.',
    component: ({ name }: { name: string }) => (
      <div>Hello {name}!</div>
    )
  })
```

## Using an exposed component

```tsx
import { usePluginComponent } from '@grafana/runtime';

export const MyComponent = () => {
  const { component: Component, isLoading } = usePluginComponent('myorg-basic-app/reusable-component');

  return (
    <>
      <div>My component</div>
      { isLoading ? "Loading..." : <Component name="John" /> }
    </>
  )
}
```

## Best practices

- **Wrap your component with providers** - if you want to access any plugin specific state in your component make sure to wrap it with the necessary React context providers (e.g. for Redux) 

## Access plugin meta information in an exposed component

```tsx
import { usePluginContext } from "@grafana/runtime";
import pluginJson from './plugin.json';

export const plugin = new AppPlugin()
  .exposeComponent({
    id: `${pluginJson.id}/reusable-component`,
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