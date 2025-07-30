---
id: register-an-extension
title: Register an extension
description: Make part of the UI extendable with links or components defined by plugins
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
sidebar_position: 20
---

import ExtensionPoints from '@shared/extension-points.md';

A UI extension is either a plugin-defined link or a React component that you can render in the core Grafana UI or in another app plugin. 

Compared to [just exposing a component](./expose-a-component.md), when you register an extension against one or more extension point IDs you can control who has access to your components. This can be more appropriate when looking to extend Grafana's core UI, or for when you need more control over what should be allowed to use your plugin's extension.

Read more about extensions under [key concepts](../../key-concepts/ui-extensions.md).

<ExtensionPoints/>

:::warning

You must [update](#updating-pluginjson-metadata) your `plugin.json` metadata to list any registered extensions.

:::

## Work with link extensions

### Register a link extension

You can add an extension for a link. For example:

```tsx
import { PluginExtensionPoints } from '@grafana/data';
import pluginJson from './plugin.json';

export const plugin = new AppPlugin().addLink({
  title: '...', // This appears as the label for the link
  description: '...',
  targets: [PluginExtensionPoints.DashboardPanelMenu], // Show it in the panel menu
  path: `/a/${pluginJson.id}/foo`, // Path can only point somewhere under the plugin
});
```

### Hide a link in certain conditions

You can hide a link at the extension point. For example:

```tsx
import { PluginExtensionPoints } from '@grafana/data';

export const plugin = new AppPlugin().addLink({
  title: '...',
  description: '...',
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

### Update the path based on the context

```tsx
import { PluginExtensionPoints } from '@grafana/data';

export const plugin = new AppPlugin().addLink({
  title: '...',
  description: '...',
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

### Open a modal from the `onClick()`

```tsx
import { PluginExtensionPoints } from '@grafana/data';
import { Button, Modal } from '@grafana/ui';

export const plugin = new AppPlugin().addLink({
  title: '...',
  description: '...',
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

## Work with component extensions

### Best practices for adding components

- **Use the props** - check what props the extension point is passing to the components and use them to implement a more tailored experience.
- **Wrap your component with providers** - if you want to access any plugin specific state in your component make sure to wrap it with the necessary React context providers (e.g. for Redux).
- **Use the enum for Grafana extension point IDs** - if you are registering a component to one of the available Grafana extension points, make sure that you use the [`PluginExtensionPoints` enum exposed by the `@grafana/data`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L121) package.

### Register a component extension

You can register an extension for a component. For example:

```tsx
import { PluginExtensionPoints } from '@grafana/data';

export const plugin = new AppPlugin().addComponent({
  title: 'User profile tab',
  description: '...',
  targets: [PluginExtensionPoints.UserProfileTab],
  component: () => <div>This is a new tab on the user profile page.</div>,
});
```

### Access the plugin's meta in a component

You can use the `usePluginContext()` hook to access any plugin specific meta information inside your component. The hook returns a [`PluginMeta`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/plugin.ts#L62) object. This can be useful because the component that you register from your plugin won't be rendered under the React tree of your plugin, but somewhere else in the UI.

```tsx
import { usePluginContext, PluginExtensionPoints } from '@grafana/data';

export const plugin = new AppPlugin().addComponent({
  title: 'User profile tab',
  description: '...',
  targets: [PluginExtensionPoints.UserProfileTab],
  component: () => {
    const { meta } = usePluginContext();

    // The `jsonData` property is an object that your plugin can manage
    // using the Grafana Rest APIs
    return <div>Plugin specific setting: {meta.jsonData.foo}</div>;
  },
});
```

### Access the plugin's state in a component

To access the plugin's state, do the following:

```tsx
import { PluginExtensionPoints } from '@grafana/data';
import { MyCustomDataProvider } from './MyCustomDataProvider';

export const plugin = new AppPlugin().addComponent({
  title: 'User profile tab',
  description: '...',
  targets: [PluginExtensionPoints.UserProfileTab],
  component: () => (
    <MyCustomDataProvider>
      <div>Plugin specific setting: {meta.jsonData.foo}</div>
    </MyCustomDataProvider>
  ),
});
```

### Hide a component in certain conditions

Simply return `null` from your component in order to not render anything and thereby hide the component.

```tsx
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

## Update the plugin.json metadata

After you have defined a link or component extension and registered it against an extension point, you must update your `plugin.json` metadata.

For example:

```json
"extensions": [
    {
      "extensionPointId": "grafana/dashboard/panel/menu/v1",
      "type": "link"
      "title": "My app",
      "description": "Link to my app"
    }
 ]
```

For more information, see the `plugin.json` [reference](../../reference/metadata.md#extensions).

## Troubleshooting

If you cannot see your link or component extension check the following: 

1. **Check the console logs** - your link or component may not be appearing due to validation errors. Look for the relevant logs in your browser's console.
1. **Check the `targets`** - make sure that you are using the correct extension point IDs, and always use the `PluginExtensionPoints` enum for Grafana extension points.
1. **Check the links `configure()` function** - if your link has a `configure()` function which is returning `undefined`, the link is hidden.
1. **Check your component's implementation** - if your component returns `null` it won't be rendered at the extension point.
1. **Check if you register too many links or components** - certain extension points limit the number of links or components allowed per plugin. If your plugin registers more links or components for the same extension point than the allowed amount, some of them may be filtered out.
1. **Check the Grafana version** - link and component extensions are only supported after Grafana version **`>=10.1.0`**. `addLink()` and `addComponent()` are only supported in versions **>=`11.1.0`**. 



