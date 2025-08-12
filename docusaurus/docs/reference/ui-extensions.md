---
id: ui-extensions
title: UI extensions reference guide
description: Reference guide for UI extensions - available extension points, methods, and hooks.
keywords:
  - grafana
  - plugins
  - documentation
  - plugin.json
  - API reference
  - UI extensions
sidebar_position: 50
---

This page describes the UI Extensions API in detail, including:

- [Extension points in Grafana](#extension-points-in-grafana)
- [Methods](#methods)
- [Hooks](#hooks)

## Extension points in Grafana

Use the [`PluginExtensionPoints`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L121) enum exposed by the `@grafana/data` package to access the extension points within Grafana. 

```typescript
import { PluginExtensionPoints } from '@grafana/data';

const extensionPointId = PluginExtensionPoints.DashboardPanelMenu;
```

The following Extension Points are available:

| Extension Point ID                | Type      | Description                                                          |
| --------------------------------- | --------- | -------------------------------------------------------------------- |
| **`AlertingAlertingRuleAction`**  | Link      | Extend the alert rule menu with custom actions for alerting rules.   |
| **`AlertingHomePage`**            | Component | Extend the alerting home page with custom alert-creation experience. |
| **`AlertingRecordingRuleAction`** | Link      | Extend the alert rule menu with custom actions for recording rules.  |
| **`AlertInstanceAction`**         | Link      | Extend the alert instances table with custom actions.                |
| **`CommandPalette`**              | Link      | Extend the command palette with custom actions.                      |
| **`DashboardPanelMenu`**          | Link      | Extend the panel menu with custom actions.                           |
| **`ExploreToolbarAction`**        | Link      | Extend the "Add" button on the Explore page with custom actions.     |
| **`UserProfileTab`**              | Component | Extend the user profile page with custom tabs.                       |

## Methods

:::info
To learn when to add and when to expose an element (component or link) to an extension point see [Understand when to add or expose elements in Extensions](/developers/plugin-tools/reference/extensions-add-expose).
:::

### `addComponent`

:::info
Available in Grafana >=v11.1.0.
:::

This method registers a [React component](https://react.dev/learn/your-first-component) to a certain extension point to contribute a new UI experience.

```typescript
export const plugin = new AppPlugin<{}>().addComponent({
  targets: ['grafana/user/profile/tab/v1'],
  title: 'New user profile tab',
  description: 'A new tab that shows extended user profile information',
  component: () => {
    return <div>Hello World!</div>;
  },
});
```

#### Parameters

The `addComponent()` method takes a single `config` object with the following properties:

| Property          | Description                         |
| ----------------- | ------------------------------------ |
| **`targets`**     | A list of extension point IDs where the extension will be registered. <br /> _Example: `"grafana/dashboard/panel/menu/v1"`_. [See available extension points in Grafana &rarr;](#extension-points-in-grafana) |
| **`title`**       | A human readable title for the component.           |
| **`description`** | A human readable description for the component.                           |
| **`component`**   | The [React component](https://react.dev/learn/your-first-component) that will be rendered by the extension point. Note that the props passed to the component are defined by each extension point.                |

#### Return value

The method returns the `AppPlugin` instance to allow for chaining.

#### Examples

- [Accessing plugin meta-data in the component](../how-to-guides/ui-extensions/register-an-extension.md#access-the-plugins-meta-in-a-component)
- [Access your plugin's state inside the component](../how-to-guides/ui-extensions/register-an-extension.md#access-the-plugins-state-in-a-component)
- [Hide a component in certain conditions](../how-to-guides/ui-extensions/register-an-extension.md#hide-a-component-in-certain-conditions)

#### See also

- [Best practices for adding components](../how-to-guides/ui-extensions/register-an-extension.md#best-practices-for-adding-components)

### `addLink`

:::info
Available in Grafana >=v11.1.0.
:::

This method registers a link extension to a certain extension point. Use link extensions to navigate to different parts of the Grafana UI or other plugins, and to include modal elements declared via an onClick.

```typescript
export const plugin = new AppPlugin<{}>().addLink({
  targets: ['grafana/dashboard/panel/menu/v1'],
  title: 'Declare incident',
  description: 'Declare an incident and attach the panel context to it',
  path: '/a/myorg-incidents-app/incidents',
});
```

#### Parameters

The `addLink()` method takes a single `config` object with the following properties:

| Property          | Description                                                                                                                                                                                                                        | Required |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **`targets`**     | A list of extension point IDs where the extension will be registered. <br /> _Example: `"grafana/dashboard/panel/menu/v1"`. [See available extension points in Grafana &rarr;](#extension-points-in-grafana)_                      | true     |
| **`title`**       | A human readable title for the link.                                                                                                                                                                                               | true     |
| **`description`** | A human readable description for the link.                                                                                                                                                                                         | true     |
| **`path?`**       | A path within your app plugin where you would like to send users when they click the link. (Use either `path` or `onClick`.) <br /> _Example: `"/a/myorg-incidents-app/incidents"`_                                                | true     |
| **`onClick?`**    | A callback that should be triggered when the user clicks the link. (Use either `path` or `onClick`.)                                                                                                                               | false    |
| **`category?`**   | A category that should be used to group your link with other links.                                                                                                                                                                | false    |
| **`icon?`**       | An icon that should be used while displaying your link. <br /> _Example: `"edit"` or `"bookmark"`. [See all available icon names &rarr;](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/icon.ts#L1)_ | false    |
| **`configure?`**  | A function that is called prior to displaying the link which enables you to dynamically change or hide your link depending on its `context`.                                                                                       | false    |

#### Return value

The method returns the `AppPlugin` instance to allow for chaining.

#### Examples

- [Hide a link in certain conditions](../how-to-guides/ui-extensions/register-an-extension.md#hide-a-link-in-certain-conditions)
- [Update the path based on the context](../how-to-guides/ui-extensions/register-an-extension.md#update-the-path-based-on-the-context)
- [Open a modal from the `onClick()`](../how-to-guides/ui-extensions/register-an-extension.md#open-a-modal-from-the-onclick)

### `exposeComponent`

:::info
Available in Grafana >=v11.1.0.
:::

This method exposes a React component and makes it available for other plugins to use. Other plugins can render the component within their app by calling [usePluginComponent()](#useplugincomponent) and referencing the `id` of the exposed component.

```typescript
export const plugin = new AppPlugin<{}>()
    .exposeComponent({
        id: "myorg-incidents-app/create-incident-form/v1",],
        title: "Create incident form",
        description: "A form to create a new incident.",
        component: () => {
            return <div>Hello World!</div>;
        },
    });
```

#### Parameters

The `exposeComponent()` method takes a single `config` object with the following properties:

| Property          | Description                                                                                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`id`**          | A unique string identifier of the component you are exposing. **It must be prefixed with your plugin ID.** <br /> _Example: `"myorg-incidents-app/create-incident-form/v1"`._                                                               |
| **`title`**       | A human readable title for the component.                                                                                                                                                                                                   |
| **`description`** | A human readable description for the component.                                                                                                                                                                                             |
| **`component`**   | A React component that you are exposing. <br /> _Make sure to wrap it with the necessary React context providers that the component is relying on, as this component is not going to be rendered under the same React tree as your plugin._ |

#### Return value

The method returns the `AppPlugin` instance to allow for chaining.

#### Examples

- [Access plugin meta information in an exposed component](../how-to-guides/ui-extensions/expose-a-component.md#access-plugin-meta-information-in-an-exposed-component)

#### See also

- [Best practices for exposing components](../how-to-guides/ui-extensions/expose-a-component.md#best-practices)

## Hooks

### `usePluginComponent`

:::info
Available in Grafana >=v11.1.0.
:::

This react hook **fetches a single react component** that's been exposed by a plugin with a unique ID. Plugins can expose components using the [`AppPlugin.exposeComponent()`](#exposecomponent) method.

```typescript
import { usePluginComponent } from '@grafana/runtime';

const { component: Component, isLoading } = usePluginComponent('myorg-incidents-app/create-incident-form/v1');
```

#### Parameters

- **`id`** - A unique id that identifies the component.

#### Return value

The hook returns the following object:

```typescript
const {
  // The react component that was exposed by the plugin
  // (`null` if no component is exposed with that id)
  component: React.ComponentType<Props> | undefined | null;

  // `true` until the plugin exposing the component is still loading
  isLoading: boolean;
} = usePluginComponent(id);
```

#### Examples

- [How to render a component exposed by another plugin](../how-to-guides/ui-extensions/use-an-exposed-component.md#use-an-exposed-component)

### `usePluginComponents`

:::info
Available in Grafana >=v11.1.0.
:::

This react hook **fetches components** that are registered to a certain extension point. Use component extensions to render custom UI components. Plugins can register components using the [`AppPlugin.addComponent()`](#addcomponent) method.

```typescript
import { usePluginComponents } from '@grafana/runtime';

const { components, isLoading } = usePluginComponents({
  extensionPointId: 'grafana/user/profile/tab/v1',
  limitPerPlugin: 1,
});
```

#### Parameters

The `.usePluginComponents()` method takes a single `options` object with the following properties:

| Property               | Description                                                                                                                                                                                                                                                                                                                            | Required |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **`extensionPointId`** | A unique id to fetch link extensions for. In case you are implementing a new extension point, this is what plugins reference when registering extensions. **Plugins must prefix this with their plugin id, while core Grafana extensions points have to use a `"grafana/"` prefix.** <br /> _Example: `"grafana/user/profile/tab/v1"`_ | true     |
| **`limitPerPlugin?`**  | - The maximum number of extensions to return per plugin. Default is no limit.                                                                                                                                                                                                                                                          | False    |

#### Return value

The hook returns the following object: 

```typescript
const {
  // An empty array if no plugins have registered extensions for this extension point yet
  components: PluginExtensionComponent[];

  // `true` until any plugins extending this extension point
  // are still loading
  isLoading: boolean;
} = usePluginComponents(options);
```

For more information refer to [`PluginExtensionComponent`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L35).

#### Examples

- [Pass data to the components using props](../how-to-guides/ui-extensions/create-an-extension-point.md#passing-data-to-the-components)
- [Limit which plugins can register components to your extension point](../how-to-guides/ui-extensions/create-an-extension-point.md#limit-which-plugins-can-register-components)

#### See also

- [Best practices for rendering components added by plugins](../how-to-guides/ui-extensions/create-an-extension-point.md#best-practices-for-rendering-components)

### `usePluginLinks`

:::info
Available in Grafana >=v11.1.0.
:::

This react hook **fetches links** that are registered to a certain extension point. Plugins can register links using the [`AppPlugin.addLink()`](#addlink) method.

```typescript
import { usePluginLinks } from '@grafana/runtime';

const { links, isLoading } = usePluginLinks({
  extensionPointId: 'grafana/dashboard/panel/menu/v1',
  limitPerPlugin: 2,
  context: {
    panelId: '...',
  },
});
```

#### Parameters

The `.usePluginLinks()` method takes a single `options` object with the following properties:

| Property               | Description                                                                                                                                                                                                                                                                                                                                | Required |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| **`extensionPointId`** | A unique id to fetch link extensions for. In case you are implementing a new extension point, this is what plugins reference when registering extensions. **Plugins must prefix this with their plugin id, while core Grafana extensions points have to use a `"grafana/"` prefix.** <br /> _Example: `"grafana/dashboard/panel/menu/v1"`_ | true     |
| **`context?`**         | An arbitrary object that you would like to share with the extensions. This can be used to pass data to the extensions.                                                                                                                                                                                                                     | false    |
| **`limitPerPlugin?`**  | The maximum number of extensions to return per plugin. Default is no limit.                                                                                                                                                                                                                                                                | false    |

#### Return value

The hook returns the following object:

```typescript
const {
  // An empty array if no plugins have registered extensions for this extension point yet
  links: PluginExtensionLink[];

  // `true` until any plugins extending this extension point
  // are still loading
  isLoading: boolean;
} = usePluginLinks(options);
```

For more information refer to [`PluginExtensionLink`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L27).

#### Examples

- [Pass data to the links](../how-to-guides/ui-extensions/create-an-extension-point.md#passing-data-to-links)
- [Limit the number of links by plugins](../how-to-guides/ui-extensions/create-an-extension-point.md#limit-the-number-of-extensions-by-plugins)
- [Limit which plugins can register links to your extension point](../how-to-guides/ui-extensions/create-an-extension-point.md#limit-which-plugins-can-register-links)

#### See also

- [Best practices for rendering links added by plugins](../how-to-guides/ui-extensions/create-an-extension-point.md#best-practices-for-rendering-links)

## Deprecated elements

:::warning
These elements are deprecated and have been removed starting in Grafana v12.
:::

### `getPluginExtensions` 

:::warning
This function has been removed starting in Grafana version 12. Use either the [`usePluginLinks()`](#usepluginlinks) or [`usePluginComponents()`](#useplugincomponents) hooks instead.
:::

This function fetches extensions (both links and components) that are registered to a certain extension point.

```typescript
import { getPluginExtensions } from '@grafana/runtime';

const { extensions } = getPluginExtensions({
  extensionPointId: 'grafana/dashboard/panel/menu/v1',
  limitPerPlugin: 2,
  context: {
    panelId: '...',
  },
});
```

#### Parameters

The `getPluginExtensions()` function takes a single `options` object with the following properties:

| Property       | Description          | Required |
| ---------------------- | --------------------------- | -------- |
| **`extensionPointId`** | A unique id to fetch link extensions for. In case you are implementing a new extension point, this is what plugins reference when registering extensions. **Plugins must prefix this with their plugin id, while core Grafana extensions points have to use a `"grafana/"` prefix.** <br /> _Example: `"grafana/dashboard/panel/menu/v1"`_ | true     |
| **`context?`**         | An arbitrary object that you would like to share with the extensions. This can be used to pass data to the extensions.                   | false    |
| **`limitPerPlugin?`**  | - The maximum number of extensions to return per plugin. Default is no limit.       | false    |

#### Return value

The hook returns the following object:

```typescript
const {
  // An empty array if no plugins have registered extensions for this extension point yet
  extensions: PluginExtension[];
} = getPluginExtensions(options);
```

For more information, see [`PluginExtension`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L40).


### `usePluginExtensions` 

:::warning
This hook has been removed starting in Grafana version 12. Use either the [`usePluginLinks()`](#usepluginlinks) or [`usePluginComponents()`](#useplugincomponents) hooks instead.
:::

This react hook fetches extensions (both links and components) that are registered to a certain extension point.

```typescript
import { usePluginExtensions } from '@grafana/runtime';

const { extensions, isLoading } = usePluginExtensions({
  extensionPointId: 'grafana/dashboard/panel/menu/v1',
  limitPerPlugin: 2,
  context: {
    panelId: '...',
  },
});
```

#### Parameters

The `.usePluginExtensions()` method takes a single `options` object with the following properties:

| Property               | Description        | Required |
| ---------------------- |----------------------------------------- | -------- |
| **`extensionPointId`** | A unique id to fetch link extensions for. In case you are implementing a new extension point, this is what plugins reference when registering extensions. **Plugins must prefix this with their plugin id, while core Grafana extensions points have to use a `"grafana/"` prefix.** <br /> _Example: `"grafana/dashboard/panel/menu/v1"`_ | true     |
| **`context?`**         | An arbitrary object that you would like to share with the extensions. This can be used to pass data to the extensions.                     | false    |
| **`limitPerPlugin?`**  | The maximum number of extensions to return per plugin. Default is no limit.         | false    |

#### Return value

The hook returns the following object:

```typescript
const {
  // An empty array if no plugins have registered extensions for this extension point yet
  extensions: PluginExtension[];

  // `true` until any plugins extending this extension point
  // are still loading
  isLoading: boolean;
} = usePluginExtensions(options);
```

For more information, see [`PluginExtension`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L40).