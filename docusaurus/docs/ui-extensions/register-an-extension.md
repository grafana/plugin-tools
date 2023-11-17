---
id: register-an-extension
title: Register an extension from your app plugin
sidebar_label: Register an extension
sidebar_position: 1
description: Learn how to register an extension from your app plugin.
keywords:
  - grafana
  - plugins
  - plugin
  - links
  - extensions
  - app plugins
---

## Before you begin

Be sure your plugin meets the following requirements before proceeding:

- It must be an app plugin.
- It must be preloaded by setting the [preload property](../reference-plugin-json#properties) to `true` in the `plugin.json`.
- It must be installed and _enabled_ for the extension to be available.

## How to extend the Grafana UI or an app plugin from your app plugin

Add the `configureExtensionLink` method in your `module.ts(x)` file to register extensions. This requires an object containing the following properties:

- `extensionPointId` _required_ - the unique identifier of the extension point you would like to extend. See [available extension points](#available-extension-points-within-grafana) within Grafana.
- `title` _required_ - used to display your extension at the extension point.
- `description` _required_ - short description of what your extension does.
- `path` - a path within your app plugin where you would like to send users when they click the extension.
- `onClick` - a callback that should be triggered when the user clicks the extension.
- `category` - a category that we should use to group your extension with other extensions.
- `icon` - an icon that should be used while displaying your extension.
- `configure` - a function that is called prior to displaying the extension which enables you to dynamically change or hide your extension depending on its context.

:::warning

Use either `path` or `onClick` (only one is required) otherwise the extension will be hidden.

:::

### Example: Link to a new location

In the following example, we add an extension link to the Grafana dashboard panel menu. When the user clicks "Go to basic app," they are sent to `/a/myorg-basic-app/one`.

```ts title="src/module.ts"
new AppPlugin().configureExtensionLink({
  title: 'Go to basic app',
  description: 'Will send the user to the basic app',
  extensionPointId: 'grafana/dashboard/panel/menu',
  path: '/a/myorg-basic-app/one', // Must start with "/a/<PLUGIN_ID>/"
});
```

### Example: Add a regular link with query string parameters from the context

In the following example, we add an extension link to the Grafana dashboard panel menu. When the user clicks "Go to basic app," they are sent to `/a/myorg-basic-app/one?panelId=12345&timeZone=utc`.

```ts title="src/module.ts"
new AppPlugin().configureExtensionLink({
  title: 'Go to basic app',
  description: 'Will send the user to the basic app',
  extensionPointId: 'grafana/dashboard/panel/menu',
  path: '/a/myorg-basic-app/one', // Must start with "/a/<PLUGIN_ID>/"
  configure: (context: PanelContext) => {
    const { timeZone, panelId } = context;

    // You only need to return the properties that you would like to override.
    return {
      path: `/a/myorg-basic-app/one?panelId=${panelId}&timeZone=${timeZone}`,
    };
  },
});
```

### Example: Add a regular link that should be visible depending on the context

In the following example, we add an extension link to the Grafana dashboard panel menu. It will only be visible for panels with the time zone set to UTC.

```ts title="src/module.ts"
new AppPlugin().configureExtensionLink({
  title: 'Go to basic app',
  description: 'Will send the user to the basic app',
  extensionPointId: 'grafana/dashboard/panel/menu',
  path: '/a/myorg-basic-app/one', // Must start with "/a/<PLUGIN_ID>/"
  configure: (context: PanelContext) => {
    const { timeZone } = context;

    switch (toLowerCase(timeZone)) {
      case 'utc':
        return {}; // no overrides applied but we want to display the extension.
      default:
        return undefined; // returning undefined from the configure function will hide the extension.
    }
  },
});
```

### Example: Display a modal view

In the following example, we add an extension link to the Grafana dashboard panel menu. It will open a flow (defined in our app) in a modal on top of the current view.

```ts title="src/module.ts"
new AppPlugin().configureExtensionLink({
  title: 'Create incident',
  description: 'Will open a prefilled form to create an incident.',
  extensionPointId: 'grafana/dashboard/panel/menu',
  onClick: (event, params) => {
    const { context, openModal } = params;
    const { targets = [], title } = context;

    openModal({
      title: 'Create incident',
      body: (props) => <CreateIncidentForm {...props} title={title} targets={targets}>
    });
  }
});
```

### Example: Display a React component

Using React components as extensions is a powerful way to extend the functionality of an existing UI either in core Grafana or in an other plugin.

```ts title="src/module.ts"
new AppPlugin().configureExtensionComponent({
  title: 'My component extension',
  description: 'Renders a button at a pre-defined extension point.',
  extensionPointId: 'grafana/<extension-point-id>',
  component: MyExtension,
});
```

```tsx title="src/components/MyExtension.tsx"
export const MyExtension = () => (
  <Button onClick={() => {}} variant="secondary" type="button">
    Extend UI
  </Button>
);
```

### Example: Use the context of the extension point in a component

Extension points can pass contextual information to the extensions they render, we refer to this data as `context`.
In case it is a core extension point (defined in core Grafana), there is also always a type definition available for these context objects. In the following example we will cover how to use this `context` in our component extension and also get the static types right.

```ts title="src/module.ts"
// This could also come from another plugin or defined manually if a plugin doesn't expose it.
import { PluginExtensionSampleContext } from '@grafana/data';

new AppPlugin().configureExtensionComponent<PluginExtensionSampleContext>({
  title: 'My component extension',
  description: 'Renders a button at a pre-defined extension point.',
  extensionPointId: 'grafana/<extension-point-id>',
  component: MyExtension,
});
```

```tsx title="src/components/MyExtension.tsx"
type Props = {
  context: PluginExtensionSampleContext;
};

export const MyExtension = ({ context }: Props) => (
  <Button onClick={() => {}} variant="secondary" type="button">
    Create incident from {context.name}
  </Button>
);
```

### Example: Access plugin information in a component extension

It can happen that we would like to access some meta information of our plugin inside the component extension dynamically. `@grafana/data` exposes some helper hooks to make it possible:

```ts title="src/module.ts"
new AppPlugin().configureExtensionComponent({
  title: 'My component extension',
  description: 'Renders a button at a pre-defined extension point.',
  extensionPointId: 'grafana/<extension-point-id>',
  component: MyExtension,
});
```

```tsx title="src/components/MyExtension.tsx"
import { usePluginMeta, usePluginJsonData } from '@grafana/data';

export const MyExtension = () => {
  const meta = usePluginMeta();
  const jsonData = usePluginJsonData();

  if (meta.info.version !== '1.0.0') {
    return null;
  }

  return (
    <Button onClick={() => {}} variant="secondary" type="button">
      Create incident ({jsonData.postFix})
    </Button>
  );
};
```

## Available extension points within Grafana

An _extension point_ is a location within the Grafana UI where a plugin can insert links. The IDs of all extension points within Grafana start with `grafana/`. For example, you can use the following extension point ID:

- `grafana/dashboard/panel/menu`: extension point for all panel dropdown menus in dashboards
- `grafana/explore/toolbar/action`: extension point for toolbar actions in explore
