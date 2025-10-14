---
id: create-an-extension-point
title: Render links in an extension point
sidebar_label: Use extension points to render links
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

An extension point is a part of your plugin or Grafana UI where you can render content (links, functions or React components) from other plugins. Use them to extend your users' experience based on a context exposed by the extension point.

:::note
Read more about extensions under [key concepts](../../how-to-guides/ui-extensions/ui-extensions-concepts.md). <br />
For reference documentation, including the APIs, see [UI extensions reference guide](../../reference/ui-extensions-reference).
:::

## Best practices for rendering links

- **Make sure your UI handles multiple links** <br /> Multiple plugins may add links to your extension point. Make sure your extension point can handle this and still provide good user experience. See how you can [limit the number of extensions in your extension point](#limit-the-number-of-extensions-in-your-extension-point).
- **Share contextual information** <br /> Think about what contextual information could be useful for other plugins and add this to the `context` object. For example, the panel menu extension point shares the `panelId` and the `timeRange`. Note that the `context{}` object always gets frozen before being passed to the links, so it can't be mutated.
- **Avoid unnecessary re-renders** <br />
  - **Static context**

    ```ts
    // Define the `context` object outside of the component if it only has static values
    const context = { foo: 'bar' };

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

## Create an extension point to render links

1. Create the extension point component:

```tsx title="src/components/InstanceToolbar.tsx"
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

2. Declare the extension point in your `plugin.json`:

```json title="src/plugin.json"
{
  ...
  "extensions": {
    "extensionPoints": [
      {
        "id": "myorg-foo-app/toolbar/v1",
      }
    ]
  }
}
```

## Passing data to links

1. Update the component to pass context data:

```tsx title="src/components/InstanceToolbar.tsx"
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

2. Make sure your `plugin.json` is up to date:
<details>
<summary>src/plugin.json</summary>

```json title="src/plugin.json"
{
  ...
  "extensions": {
    "extensionPoints": [
      {
        "id": "myorg-foo-app/toolbar/v1",
      }
    ]
  }
}
```

</details>

## Limit the number of extensions in your extension point

If you have limited space on the UI, you can limit the number of extensions in your extension point. By default there is no limit.

1. Update the component to limit extensions per plugin:

```tsx title="src/components/InstanceToolbar.tsx"
import { usePluginLinks } from '@grafana/runtime';

export const InstanceToolbar = () => {
  // Only one link per plugin is allowed.
  // (If a plugin registers more than one links, then the rest will be ignored
  // and won't be returned by the hook.)
  const { links, isLoading } = usePluginLinks({ extensionPointId, limitPerPlugin: 1 });

  // ...
};
```

2. Make sure your `plugin.json` is up to date:
<details>
<summary>src/plugin.json</summary>

```json title="src/plugin.json"
{
  ...
  "extensions": {
    "extensionPoints": [
      {
        "id": "myorg-foo-app/toolbar/v1",
      }
    ]
  }
}
```

</details>

## Limit which plugins can register links in your extension point

1. Update the component to filter plugins:

```tsx title="src/components/InstanceToolbar.tsx"
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

2. Make sure your `plugin.json` is up to date:
<details>
<summary>src/plugin.json</summary>

```json title="src/plugin.json"
{
  ...
  "extensions": {
    "extensionPoints": [
      {
        "id": "myorg-foo-app/toolbar/v1",
      }
    ]
  }
}
```

</details>
