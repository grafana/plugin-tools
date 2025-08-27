---
id: create-an-extension-point
title: Render content in an extension point
sidebar_label: Render content in an extension point
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

import ExtensionPoints from '@shared/extension-points.md';

An extension point is a part of your plugin or Grafana UI where other plugins can add links or React components via hooks. You can use them to extend your users' experience based on a context exposed by the extension point.

Read more about extensions under [key concepts](../../key-concepts/ui-extensions.md).

<ExtensionPoints/>

## Links

### Best practices for rendering links

- **Make sure your UI handles multiple links** <br /> Multiple plugins may add links to your extension point. Make sure your extension point can handle this and still provide good user experience. See how you can [limit the number of extensions in your extension point](#limit-the-number-of-extensions-in-your-extension-point).
- **Share contextual information** <br /> Think about what contextual information could be useful for other plugins and add this to the `context` object. For example, the panel menu extension point shares the `panelId` and the `timeRange`. Note that the `context{}` object always gets frozen before being passed to the links, so it can't be mutated.
- **Avoid unnecessary re-renders** <br />

  - **Static context**

    ```ts
    // Define the `context` object outside of the component if it only has static values
    const context { foo: 'bar' };

    export const InstanceToolbar = () => {
      const { links, isLoading } = usePluginLinks({ extensionPointId, context });
    ```

  - **Dynamic context**
    ```ts
    export const InstanceToolbar = ({ instanceId }) => {
      // Always use `useMemo()` when the `context` object has "dynamic" values
      const context = useMemo(() => ({ instanceId }), [instanceId]);
      const { links, isLoading } = usePluginLinks({ extensionPointId, context });
    ```

### Create an extension point to render links

```tsx
import { usePluginLinks } from '@grafana/runtime';

export const InstanceToolbar = () => {
  // The `extensionPointId` must be prefixed.
  // - Core Grafana -> prefix with "grafana/"
  // - Plugin       -> prefix with "{your-plugin-id}/"
  //
  // This is also what plugins use when they call `addLink()`
  const extensionPointId = 'myorg-foo-app/toolbar/v1';
  const { links, isLoading } = usePluginLinks({ extensionPointId });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Loop through the links added by plugins */}
      {links.map(({ id, title, path, onClick }) => (
        <a href={path} title={title} key={id} onClick={onClick}>
          {title}
        </a>
      ))}
    </div>
  );
};
```

### Passing data to links

```tsx
import { usePluginLinks } from '@grafana/runtime';

export const InstanceToolbar = ({ instanceId }) => {
  const extensionPointId = 'myorg-foo-app/toolbar/v1';
  // Heads up! Always use `useMemo()` in case the `context` object has any "dynamic" properties
  // to prevent unnecessary re-renders (Otherwise a new object would be created on every render, that could
  // result in a new links{} object, that could trigger a new re-render, and so on.)
  const context = useMemo(() => ({ instanceId }), [instanceId]);
  const { links, isLoading } = usePluginLinks({ extensionPointId, context });

  // ...
};
```

### Limit the number of extensions in your extension point

If you have limited space on the UI, you can limit the number of extensions in your extension point. By default there is no limit.

```tsx
import { usePluginLinks } from '@grafana/runtime';

export const InstanceToolbar = () => {
  // Only one link per plugin is allowed.
  // (If a plugin registers more than one links, then the rest will be ignored
  // and won't be returned by the hook.)
  const { links, isLoading } = usePluginLinks({ extensionPointId, limitPerPlugin: 1 });

  // ...
};
```

### Limit which plugins can register links in your extension point

```tsx
import { usePluginLinks } from '@grafana/runtime';

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

- **Make sure your UI controls the behavior** <br /> Component extensions can render different layouts and can respond to various kind of user interactions. Make sure that your UI defines clear boundaries for rendering components defined by other plugins.
- **Share contextual information** <br /> Think about what contextual information could be useful for other plugins and pass this as `props` to the components.

### Create an extension point to render components

```tsx
import { usePluginComponents } from '@grafana/runtime';

export const InstanceToolbar = () => {
  // The `extensionPointId` must be prefixed.
  // - Core Grafana -> prefix with "grafana/"
  // - Plugin       -> prefix with "{your-plugin-id}/"
  //
  // This is also what plugins use when they call `addComponent()`
  const extensionPointId = 'myorg-foo-app/toolbar/v1';
  const { components, isLoading } = usePluginComponents({ extensionPointId });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Loop through the components added by plugins */}
      {components.map(({ id, component: Component }) => (
        <Component key={id} />
      ))}
    </div>
  );
};
```

### Passing data to the components

```tsx
import { usePluginComponents } from '@grafana/runtime';

// Types for the props (passed as a generic to the hook in the following code block)
type ComponentProps = {
  instanceId: string;
};

export const InstanceToolbar = ({ instanceId }) => {
  const extensionPointId = 'myorg-foo-app/toolbar/v1';
  const { components, isLoading } = usePluginComponents<ComponentProps>({ extensionPointId });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Sharing contextual information using component props */}
      {components.map(({ id, component: Component }) => (
        <Component key={id} instanceId={instanceId} />
      ))}
    </div>
  );
};
```

### Limit which plugins can register components in your extension point

```tsx
import { usePluginComponents } from '@grafana/runtime';

export const InstanceToolbar = () => {
  const extensionPointId = 'myorg-foo-app/toolbar/v1';
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
