---
id: extension-user-render-component
title: Render components in an extension point
sidebar_label: Use extension points to render components
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

## Best practices for rendering components

- **Make sure your UI controls the behavior** <br /> Component extensions can render different layouts and can respond to various kind of user interactions. Make sure that your UI defines clear boundaries for rendering components defined by other plugins.
- **Share contextual information** <br /> Think about what contextual information could be useful for other plugins and pass this as `props` to the components.

## Create an extension point to render components

1. Create the extension point component:

```tsx title="src/components/InstanceToolbar.tsx"
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

## Passing data to the components

1. Update the component to pass props to extensions:

```tsx title="src/components/InstanceToolbar.tsx"
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

## Limit which plugins can register components in your extension point

1. Update the component to filter plugins:

```tsx title="src/components/InstanceToolbar.tsx"
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
