---
id: create-an-extension-point
title: Create an extension point
sidebar_label: Create an extension point
sidebar_position: 10
description: Learn how to provide an extension point so that other applications can contribute their extensions.
keywords:
  - grafana
  - plugins
  - plugin
  - links
  - extensions
  - extension point
  - app plugins
  - apps
---

An "extension point" is a part of your plugin UI or Grafana UI where other plugins can hook in with either links or React components to extend the user experience. [Read more about extensions under key concepts](../key-concepts/ui-extensions.md).

| Type         | Description                                                             |
| ------------- | ----------------------------------------------------------------------- |
| **Link**     | Links have a `path` and an `onClick()` property. <br /><br /> **When to use?** <br /> Use links if you would like to give plugins a way to define custom user actions for a part of your UI. These actions can either just be cross-links to the plugin, or using `onClick()` methods they can implement a more interactive on-page experience with a modal. <br /><br /> **API reference** <br /> - [`.addLink()`](../../reference/ui-extensions/addLink.md) - registering a link from a plugin <br /> - [`usePluginLinks()`](../../reference/ui-extensions/usePluginLinks.md) - fetching links registered for an extension point 
| **Component** | Components are React components that can be used to render a custom user experience. <br /><br /> **When to use?** <br /> Use components if you would like to give more freedom for plugins to extend your UI, for example to extend a configuration form with custom parts. <br /><br /> **API reference** <br /> - [`.addComponent()`](../../reference/ui-extensions/addComponent.md) - registering a component from a plugin <br /> - [`usePluginComponents()`](../../reference/ui-extensions/usePluginComponents.md) - fetching components registered for an extension point  |

## Links

### Best practices for rendering links

- **Make sure your UI handles multple links** <br /> It can happen that there are multiple plugins are adding links to your extension point. Make sure that you handle these scenarios and that your extension point still has a good user experience.
- **Share contextual information** <br /> Think about what contextual information would be useful for the links defined by plugins and **add them to the `context` object**. (E.g. share the "panelId" and the "timeRange" with panel menu links). _The `context{}` object always gets frozen before being passed to the links, so none of them can mutate it._
- **Avoid unnecessary re-renders** <br />
  - **Static `context`**
    ```ts
    // Define the `context` object outside of the component if it only has static values
    const context { foo: 'bar' };

    export const InstanceToolbar = () => {
      const { links, isLoading } = usePluginLinks({ extensionPointId, context });
    ```
  - **Dynamic `context`**
    ```ts
    export const InstanceToolbar = ({ instanceId }) => {
      // Always use `useMemo()` when the `context` object has "dynamic" values
      const context = useMemo(() => ({ instanceId }), [instanceId]);
      const { links, isLoading } = usePluginLinks({ extensionPointId, context });
    ```


### Creating an extension point for links

```tsx
import { usePluginLinks } from "@grafana/runtime";

export const InstanceToolbar = () => {
  // The `extensionPointId` must be prefixed. 
  // - Core Grafana -> prefix with "grafana/"
  // - Plugin       -> prefix with "{your-plugin-id}/"
  // 
  // This is also what plugins use when they call `.addLink()`
  const extensionPointId = "myorg-foo-app/toolbar";
  const { links, isLoading } = usePluginLinks({ extensionPointId });

  if (isLoading) {
    return (<div>Loading...</div>);
  }

  return (
    <div>
      { /* Loop through the links added by plugins */ }
      { links.map(({ id, title, path, onClick }) => (
        <a href={path} title={title} key={id} onClick={onClick}>{title}</a>
      )) }
    </div>
  )
};
```

### Passing data to links

```tsx
import { usePluginLinks } from "@grafana/runtime";

export const InstanceToolbar = ({ instanceId }) => {
  const extensionPointId = "myorg-foo-app/toolbar";
  // Heads up! Always use `useMemo()` in case the `context` object has any "dynamic" properties
  // to prevent unnecessary re-renders (Otherwise a new object would be created on every render, that could
  // result in a new links{} object, that could trigger a new re-render, and so on.) 
  const context = useMemo(() => ({ instanceId }), [instanceId]);
  const { links, isLoading } = usePluginLinks({ extensionPointId, context });

  // ...
};
```

### Limit the number of extensions by plugins

You might have limited space on the UI and you would like the limit the number of extensions plugins can register to your extension point. **(By default there is no limit.)**

```tsx
import { usePluginLinks } from "@grafana/runtime";

export const InstanceToolbar = () => {
  // Only one link per plugin is allowed.
  // (If a plugin registers more than one links, then the rest will be ignored 
  // and won't be returned by the hook.)
  const { links, isLoading } = usePluginLinks({ extensionPointId, limitPerPlugin: 1 });

  // ...
};
```

### Limit which plugins can register links

```tsx
import { usePluginLinks } from "@grafana/runtime";

export const InstanceToolbar = () => {
  const { links, isLoading } = usePluginLinks({ extensionPointId, limitPerPlugin: 1 });

  // You can rely on the `link.pluginId` prop to filter based on the plugin 
  // that has registered the extension.
  const allowedLinks = useMemo(() => {
    const allowedPluginIds = ['myorg-a-app', 'myorg-b-app'];
    return links.filter(({ pluginId }) => allowedPluginIds.includes(pluginId));
  }, [links]);

  // ...
};
```

## Components

### Best practices for rendering components

- **Make sure your UI controls the behaviour** <br /> Component extensions can render different layouts and can respond to various kind of user interactions. Make sure that your UI defines clear boundaries for rendering components defined by other plugins.
- **Share contextual information** <br /> Think about what contextual information would be useful for the components defined by plugins and **pass them as `props` to the components**.

### Creating an extension point for components

```tsx
import { usePluginComponents } from "@grafana/runtime";

export const InstanceToolbar = () => {
  // The `extensionPointId` must be prefixed. 
  // - Core Grafana -> prefix with "grafana/"
  // - Plugin       -> prefix with "{your-plugin-id}/"
  // 
  // This is also what plugins use when they call `.addComponent()`
  const extensionPointId = "myorg-foo-app/toolbar";
  const { components, isLoading } = usePluginComponents({ extensionPointId });

  if (isLoading) {
    return (<div>Loading...</div>);
  }

  return (
    <div>
      { /* Loop through the components added by plugins */ }
      { components.map(({ id, component: Component }) => <Component key={id} /> ) }
    </div>
  )
};
```

### Passing data to the components

```tsx
import { usePluginComponents } from "@grafana/runtime";

// Types for the props (passed as a generic to the hook below)
type ComponentProps = {
  instanceId: string;
}

export const InstanceToolbar = ({ instanceId }) => {
  const extensionPointId = "myorg-foo-app/toolbar";
  const { components, isLoading } = usePluginComponents<ComponentProps>({ extensionPointId });

  if (isLoading) {
    return (<div>Loading...</div>);
  }

  return (
    <div>
      { /* Sharing contextual information using component props */ }
      { components.map(({ id, component: Component }) => (
          <Component key={id} instanceId={instanceId} />
      ))}
    </div>
  )
};
```

### Limit which plugins can register components

```tsx
import { usePluginComponents } from "@grafana/runtime";

export const InstanceToolbar = () => {
  const extensionPointId = "myorg-foo-app/toolbar";
  const { components, isLoading } = usePluginComponents<ComponentProps>({ extensionPointId });
  
  // You can rely on the `component.pluginId` prop to filter based on the plugin 
  // that has registered the extension.
  const allowedComponents = useMemo(() => {
    const allowedPluginIds = ['myorg-a-app', 'myorg-b-app'];
    return components.filter(({ pluginId }) => allowedPluginIds.includes(pluginId));
  }, [components]);

  // ...
};
```
