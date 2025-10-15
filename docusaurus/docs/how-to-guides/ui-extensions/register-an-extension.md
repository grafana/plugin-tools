---
id: register-an-extension
title: Register content in an extension point
sidebar_label: Register content in an extension point
description: Register your plugin's links or components in a Grafana OSS or plugin's extension point.
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
sidebar_position: 20
---

As a developer, you may want to share content (links, components, or functions) from your app plugins. You can either expose content, or register it to an extension point. 

Compared to [just exposing your content](./expose-a-component.md), when you register an extension against one or more extension point IDs you can control who has access to your extensions. This can be more appropriate when looking to extend Grafana's core UI, or for when you need more control over what should be allowed to use your plugin's extension.

Read more about extensions under [key concepts](./ui-extensions-concepts.md).

:::warning

You must [update](#update-the-pluginjson-metadata) your `plugin.json` metadata to list any registered extensions.

:::

## Work with link extensions

### Register a link extension

The following example shows how to add a link to the panel menu in a dashboard:

1. Register the link when initialising your plugin:

```tsx title="src/module.tsx"
import { PluginExtensionPoints } from '@grafana/data';
import pluginJson from './plugin.json';

export const plugin = new AppPlugin().addLink({
  title: 'My link', // This appears as the label for the link
  description: 'My links description',
  targets: [PluginExtensionPoints.DashboardPanelMenu], // Show it in the panel menu
  path: `/a/${pluginJson.id}/foo`, // Path can only point somewhere under the plugin
});
```

2. Update the `plugin.json` with the necessary metadata:

```json title="src/plugin.json"
{
  ...
  "extensions": {
    "addedLinks": [
      {
        "title": "My link",
        "description": "My links description",
        "targets": ["grafana/dashboard/panel/menu"],
      }
    ]
  }
}
```

### Hide a link in certain conditions

You can hide a link in certain conditions using the `configure()` function.

1. Add a `configure()` function:

```tsx title="src/module.tsx"
import { PluginExtensionPoints } from '@grafana/data';

export const plugin = new AppPlugin().addLink({
  title: 'My link',
  description: 'My link description',
  targets: [PluginExtensionPoints.DashboardPanelMenu],
  path: `/a/${pluginJson.id}/foo`,
  // The `context` is coming from the extension point.
  // (Passed in to the `usePluginLinks({ context })` hook.)
  configure: (context) => {
    // Returning `undefined` will hide the link at the extension point.
    // (In this example we are NOT showing the link for "timeseries" panels.)
    if (context?.pluginId === 'timeseries') {
      return undefined;
    }

    // Returning an empty object meanst that we don't update the link properties.
    return {};
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
    "addedLinks": [
      {
        "title": "My link",
        "description": "My links description",
        "targets": ["grafana/dashboard/panel/menu"],
      }
    ]
  }
}
```

</details>

### Update the path based on the context

1. Add a `configure()` function with the following logic:

```tsx title="src/module.tsx"
import { PluginExtensionPoints } from '@grafana/data';

export const plugin = new AppPlugin().addLink({
  title: 'My link',
  description: 'My link description',
  targets: [PluginExtensionPoints.DashboardPanelMenu],
  path: `/a/${pluginJson.id}/foo`,
  configure: (context) => {
    if (context?.pluginId === 'timeseries') {
      // We render a different link for "timeseries" panels.
      //
      // Heads up! Only the following properties can be updated from the `configure()` function:
      // - title
      // - description
      // - path
      // - icon
      // - category
      return {
        path: `/a/${pluginJson.id}/foo/timeseries`,
      };
    }

    // Returning an empty object means no updates to any of the properties.
    return {};
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
    "addedLinks": [
      {
        "title": "My link",
        "description": "My links description",
        "targets": ["grafana/dashboard/panel/menu"],
      }
    ]
  }
}
```

</details>

### Open a modal from the `onClick()`

1. Add an `onClick()` handler to your links config:

```tsx title="src/module.tsx"
import { PluginExtensionPoints } from '@grafana/data';
import { Button, Modal } from '@grafana/ui';

export const plugin = new AppPlugin().addLink({
  title: 'My link',
  description: 'My links description',
  targets: [PluginExtensionPoints.DashboardPanelMenu],
  // `event` - the `React.MouseEvent` from the click event
  // `context` - the `context` object shared with the extensions
  onClick: (event, { openModal, context }) =>
    openModal({
      title: 'My modal',
      width: 500, // (Optional) - width of the modal in pixels
      height: 500, // (Optional) - height of the modal in pixels

      // Calling `onDismiss()` closes the modal
      body: ({ onDismiss }) => (
        <div>
          <div>This is our modal.</div>

          <Modal.ButtonRow>
            <Button variant="secondary" fill="outline" onClick={onDismiss}>
              Cancel
            </Button>
            <Button onClick={onDismiss}>Ok</Button>
          </Modal.ButtonRow>
        </div>
      ),
    }),
});
```

2. Make sure your `plugin.json` is up to date:
<details>
<summary>src/plugin.json</summary>

```json
{
  ...
  "extensions": {
    "addedLinks": [
      {
        "title": "My link",
        "description": "My links description",
        "targets": ["grafana/dashboard/panel/menu"],
      }
    ]
  }
}
```

</details>

## Work with component extensions

### Best practices for adding components

- **Use the props** - check what props the extension point is passing to the components and use them to implement a more tailored experience.
- **Wrap your component with providers** - if you want to access any plugin specific state in your component make sure to wrap it with the necessary React context providers (e.g. for Redux).
- **Use the enum for Grafana extension point IDs** - if you are registering a component to one of the available Grafana extension points, make sure that you use the [`PluginExtensionPoints` enum exposed by the `@grafana/data`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L121) package.

### Register a component extension

In the following example we are registering a simple component extension.

1. Register the component when initialising your plugin:

```tsx title="src/module.tsx"
import { PluginExtensionPoints } from '@grafana/data';

export const plugin = new AppPlugin().addComponent({
  title: 'User profile tab',
  description: 'User profile tab description',
  targets: [PluginExtensionPoints.UserProfileTab],
  component: () => <div>This is a new tab on the user profile page.</div>,
});
```

2. Update the `plugin.json` with necessary metadata:

```json title="src/plugin.json"
{
  ...
  "extensions": {
    "addedComponents": [
      {
        "title": "User profile tab",
        "description": "User profile tab description",
        "targets": ["grafana/user/profile/tab"],
      }
    ]
  }
}
```

### Access the plugin's meta in a component

You can use the `usePluginContext()` hook to access any plugin specific meta information inside your component. The hook returns a [`PluginMeta`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/plugin.ts#L62) object. This can be useful because the component that you register from your plugin won't be rendered under the React tree of your plugin, but somewhere else in the UI.

1. Use the `usePluginContext()` hook in your component:

```tsx title="src/module.tsx"
import { usePluginContext, PluginExtensionPoints } from '@grafana/data';

export const plugin = new AppPlugin().addComponent({
  title: 'User profile tab',
  description: 'User profile tab description',
  targets: [PluginExtensionPoints.UserProfileTab],
  component: () => {
    const { meta } = usePluginContext();

    // The `jsonData` property is an object that your plugin can manage
    // using the Grafana Rest APIs
    return <div>Plugin specific setting: {meta.jsonData.foo}</div>;
  },
});
```

2. Make sure your `plugin.json` is up to date
<details>
<summary>src/plugin.json</summary>

```json title="src/plugin.json"
{
  ...
  "extensions": {
    "addedComponents": [
      {
        "title": "User profile tab",
        "description": "User profile tab description",
        "targets": ["grafana/user/profile/tab"],
      }
    ]
  }
}
```

</details>

### Access the plugin's state in a component

1. Use the `usePluginContext()` hook to access meta info of the content-provider plugin

```tsx title="src/module.tsx"
import { usePluginContext, PluginExtensionPoints } from '@grafana/data';
import { MyCustomDataProvider } from './MyCustomDataProvider';

export const plugin = new AppPlugin().addComponent({
  title: 'User profile tab',
  description: 'User profile tab description',
  targets: [PluginExtensionPoints.UserProfileTab],
  component: () => {
    const { meta } = usePluginContext();

    return (
      <MyCustomDataProvider>
        <div>Plugin specific setting: {meta.jsonData.foo}</div>
      </MyCustomDataProvider>
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
    "addedComponents": [
      {
        "title": "User profile tab",
        "description": "User profile tab description",
        "targets": ["grafana/user/profile/tab"],
      }
    ]
  }
}
```

</details>

### Hide a component in certain conditions

Simply return `null` from your component in order to not render anything and thereby hide the component.

1. Update the component to return `null` in certain scenarios:

```tsx title="src/module.tsx"
import { usePluginContext, PluginExtensionPoints } from '@grafana/data';

export const plugin = new AppPlugin().addComponent({
  title: 'User profile tab',
  description: '...',
  targets: [PluginExtensionPoints.UserProfileTab],
  component: () => {
    const { meta } = usePluginContext();

    // For the sake of the example this condition is relying on a `jsonData` property
    // that is managed by your plugin
    if (!meta.jsonData.isExtensionEnabled) {
      return null;
    }

    return <div>Plugin specific setting: {meta.jsonData.foo}</div>;
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
    "addedComponents": [
      {
        "title": "User profile tab",
        "description": "User profile tab description",
        "targets": ["grafana/user/profile/tab"],
      }
    ]
  }
}
```

</details>

## Work with function extensions

### Best practices for adding functions

- **Handle errors** - Make sure to handle any errors that could be thrown by the function extensions.
- **Share contextual information** - Think about what contextual information could be useful for other plugins and pass this as parameters to the function.
- **Use the enum for Grafana extension point IDs** - If you are registering a function to one of the available Grafana extension points, make sure that you use the [`PluginExtensionPoints` enum exposed by the `@grafana/data`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L121) package.
- **Keep functions simple** - Function extensions should be focused and perform a single, well-defined action.

### Register a function extension

The following example shows how to register a function extension:

1. Register the function when initialising your plugin:

```tsx title="src/module.tsx"
import { PluginExtensionPoints } from '@grafana/data';

export const plugin = new AppPlugin().addFunction({
  title: 'My function',
  description: 'My function description',
  targets: [PluginExtensionPoints.DashboardPanelMenu],
  fn: (context) => {
    // Your function logic here
    console.log('Function called with context:', context);
  },
});
```

2. Update the `plugin.json` with necessary metadata:

```json title="src/plugin.json"
{
  ...
  "extensions": {
    "addedFunctions": [
      {
        "title": "My function",
        "description": "My function description",
        "targets": ["grafana/dashboard/panel/menu"],
      }
    ]
  }
}
```

## Update the plugin.json metadata

After you have defined a link, component, or function extension and registered it against an extension point, you must update your `plugin.json` metadata.

For example:

```json title="src/plugin.json"
{
  ...
  "extensions": {
    "addedLinks": [
      {
        "title": "My app",
        "description": "Link to my app",
        "targets": ["grafana/dashboard/panel/menu"],
      }
    ],
    "addedComponents": [
      {
        "title": "User profile tab",
        "description": "User profile tab description",
        "targets": ["grafana/user/profile/tab"],
      }
    ],
    "addedFunctions": [
      {
        "title": "My function",
        "description": "My function description",
        "targets": ["grafana/dashboard/dropzone/v1"],
      }
    ]
  }
}
```

For more information, see the `plugin.json` [reference doc](../../reference/metadata.md#extensions).

## Troubleshooting

If you cannot see your link, component, or function extension check the following:

1. **Check the console logs** - your link, component, or function may not be appearing due to validation errors. Look for the relevant logs in your browser's console.
1. **Check the `targets`** - make sure that you are using the correct extension point IDs, and always use the `PluginExtensionPoints` enum for Grafana extension points.
1. **Check the links `configure()` function** - if your link has a `configure()` function which is returning `undefined`, the link is hidden.
1. **Check your component's implementation** - if your component returns `null` it won't be rendered at the extension point.
1. **Check your function's implementation** - if your function throws an error, it may not be executed properly. Make sure to handle errors appropriately.
1. **Check if you register too many links, components, or functions** - certain extension points limit the number of extensions allowed per plugin. If your plugin registers more extensions for the same extension point than the allowed amount, some of them may be filtered out.
1. **Check the Grafana version** - link, component, and function extensions are only supported after Grafana version **`>=10.1.0`**. `addLink()` and `addComponent()` are only supported in versions **>=`11.1.0`**, while `addFunction()` is only supported in versions **>=`11.6.0`**.
