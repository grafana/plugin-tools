---
id: ui-extensions
title: UI extensions API guide
description: Reference API guide for UI extensions.
keywords:
  - grafana
  - plugins
  - documentation
  - plugin.json
  - API reference
  - UI extensions
sidebar_position: 50
---

This page describes the UI Extensions APIs in detail, including:

- [Methods to register or expose content](#i-want-to-register-or-expose-content)
- [Hooks to render content](#i-want-to-use-renderable-content)

:::note
Read [Extensions key concepts](../../how-to-guides/ui-extensions/ui-extensions-concepts) for an overview of the extension framework.
:::

## I want to register or expose content

If you’re a plugin developer and want other plugins or Grafana Core to render links or components from your app plugin:

- Use the `the add*` APIs to register content (links or components). See [Register an extension](../../how-to-guides/ui-extensions/register-an-extension) for more information.
- Use the `expose*` APIs to expose components. See [Expose a component](../../how-to-guides/ui-extensions/expose-a-component) for more information.

### `addComponent`

:::info
Available in Grafana >=v11.1.0.
:::

Use this method to register a [React component](https://react.dev/learn/your-first-component) in a certain extension point to contribute a new UI experience.

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

| Property          | Description                                                                                                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`targets`**     | A list of extension point IDs where the extension will be registered. <br /> _Example: `"grafana/dashboard/panel/menu/v1"`_. [See available extension points in Grafana &rarr;](./extension-points) |
| **`title`**       | A human readable title for the component.                                                                                                                                                           |
| **`description`** | A human readable description for the component.                                                                                                                                                     |
| **`component`**   | The [React component](https://react.dev/learn/your-first-component) that will be rendered by the extension point. Note that the props passed to the component are defined by each extension point.  |

#### Return value

The method returns the `AppPlugin` instance to allow for chaining.

#### Examples

- [Accessing plugin meta-data in the component](../../how-to-guides/ui-extensions/register-an-extension.md#access-the-plugins-meta-in-a-component)
- [Access your plugin's state inside the component](../../how-to-guides/ui-extensions/register-an-extension.md#access-the-plugins-state-in-a-component)
- [Hide a component in certain conditions](../../how-to-guides/ui-extensions/register-an-extension.md#hide-a-component-in-certain-conditions)

#### See also

- [Best practices for adding components](../../how-to-guides/ui-extensions/register-an-extension.md#best-practices-for-adding-components)

### `addLink`

:::info
Available in Grafana >=v11.1.0.
:::

Use this method to register a link extension in an extension point.

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
| **`targets`**     | A list of extension point IDs where the extension will be registered. <br /> _Example: `"grafana/dashboard/panel/menu/v1"`. [See available extension points in Grafana &rarr;](./extension-points)_                                | true     |
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

- [Hide a link in certain conditions](../../how-to-guides/ui-extensions/register-an-extension.md#hide-a-link-in-certain-conditions)
- [Update the path based on the context](../../how-to-guides/ui-extensions/register-an-extension.md#update-the-path-based-on-the-context)
- [Open a modal from the `onClick()`](../../how-to-guides/ui-extensions/register-an-extension.md#open-a-modal-from-the-onclick)

### `addFunction`

:::info
Available in Grafana >=v11.6.0.
:::

Use this method to register a function extension at an extension point.

```typescript
export const plugin = new AppPlugin<{}>().addFunction({
  targets: ['grafana/dashboard/dropzone/v1'],
  title: 'Drag and drop data',
  description: 'Support for content being drag and dropped on to dashboards',
  fn: async (data: File) => {
    const text = await data.text();

    return {
      title: 'Text panel',
      panel: {
        type: 'text',
        title: 'Dropped contents',
        options: {
          mode: 'markdown',
          content: text,
        },
      },
      component: PasteEditor(text),
    };
  },
});
```

#### Parameters

The `addFunction()` method takes a single `config` object with the following properties:

| Property          | Description                                                                                                                                                                                         | Required |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **`targets`**     | A list of extension point IDs where the extension will be registered. <br /> _Example: `"grafana/dashboard/panel/menu/v1"`. [See available extension points in Grafana &rarr;](./extension-points)_ | true     |
| **`title`**       | A human readable title for the function.                                                                                                                                                            | true     |
| **`description`** | A human readable description for the function.                                                                                                                                                      | true     |
| **`fn`**          | A function within your app plugin that should be triggered when the extension point action occurs.                                                                                                  | true     |

#### Return value

The method returns the `AppPlugin` instance to allow for chaining.

#### Examples

- [Create an extension point for functions](../../how-to-guides/ui-extensions/extension-user-use-function#create-an-extension-point-for-functions)

#### See also

- [Best practices for function extensions](../../how-to-guides/ui-extensions/extension-user-use-function#best-practices-for-function-extensions)

### `exposeComponent`

:::info
Available in Grafana >=v11.1.0.
:::

Use this method to expose a React component and make it available for other plugins to use. Other users will be able to render this component at their extension point by calling `usePluginComponent()` and referencing the `id` of the exposed component.

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

- [Access plugin meta information in an exposed component](../../how-to-guides/ui-extensions/expose-a-component.md#access-plugin-meta-information-in-an-exposed-component)

#### See also

- [Best practices for exposing components](../../how-to-guides/ui-extensions/expose-a-component.md#best-practices)

## I want to use renderable content

If you want to render extension content in your extension point, use the following hooks:

### `usePluginComponent`

:::info
Available in Grafana >=v11.1.0.
:::

Use this React hook to fetch a single component that's been previously **exposed** by a plugin using the `AppPlugin.exposeComponent()` method.

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

- [How to render a component exposed by another plugin](../../how-to-guides/ui-extensions/use-an-exposed-component.md#use-an-exposed-component)

### `usePluginComponents`

:::info
Available in Grafana >=v11.1.0.
:::

Use this react hook to fetch **components** that have been previously **registered** in an extension point using the `AppPlugin.addComponent()` method.

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

- [Pass data to the components using props](../../how-to-guides/ui-extensions/extension-user-render-component.md#passing-data-to-the-components)
- [Limit which plugins can register components in your extension point](../../how-to-guides/ui-extensions/extension-user-render-component.md#limit-which-plugins-can-register-components-in-your-extension-point)

#### See also

- [Best practices for rendering components added by plugins](../../how-to-guides/ui-extensions/extension-user-render-component.md#best-practices-for-rendering-components)

### `usePluginLinks`

:::info
Available in Grafana >=v11.1.0.
:::

Use this React hook to fetch **links** that have been previously **registered** in an extension point using the `AppPlugin.addLink()` method.

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

- [Pass data to the links](../../how-to-guides/ui-extensions/create-an-extension-point.md#passing-data-to-links)
- [Limit the number of extensions in your extension point](../../how-to-guides/ui-extensions/create-an-extension-point.md#limit-the-number-of-extensions-in-your-extension-point)
- [Limit which plugins can register links in your extension point](../../how-to-guides/ui-extensions/create-an-extension-point.md#limit-which-plugins-can-register-links-in-your-extension-point)

### `usePluginFunctions`

:::info
Available in Grafana >=v11.6.0.
:::

Use this React hook to fetch **functions** that have been previously **registered** in an extension point using the `AppPlugin.addFunction()` method.

```typescript
import { usePluginFunctions } from '@grafana/runtime';

const { functions, isLoading } = usePluginFunctions<(data: string) => void>({
  extensionPointId: 'grafana/dashboard/dropzone/v1',
  limitPerPlugin: 2,
});
```

#### Parameters

The `.usePluginFunctions()` method takes a single `options` object with the following properties:

| Property               | Description                                                                                                                                                                                                                                                                                                                                | Required |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| **`extensionPointId`** | A unique id to fetch link extensions for. In case you are implementing a new extension point, this is what plugins reference when registering extensions. **Plugins must prefix this with their plugin id, while core Grafana extensions points have to use a `"grafana/"` prefix.** <br /> _Example: `"grafana/dashboard/panel/menu/v1"`_ | true     |
| **`limitPerPlugin?`**  | The maximum number of extensions to return per plugin. Default is no limit.                                                                                                                                                                                                                                                                | false    |

#### Return value

The hook returns the following object:

```typescript
const {
  // An empty array if no plugins have registered extensions for this extension point yet
  functions: PluginExtensionFunction[];

  // `true` until any plugins extending this extension point
  // are still loading
  isLoading: boolean;
} = usePluginLinks(options);
```

For more information refer to [`PluginExtensionFunction`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L46).

#### Examples

- [Create an extension point for functions](../../how-to-guides/ui-extensions/extension-user-use-function#create-an-extension-point-for-functions)
- [Limit which plugins can register functions in your extension point](../../how-to-guides/ui-extensions/extension-user-use-function#limit-which-plugins-can-register-functions-in-your-extension-point)
