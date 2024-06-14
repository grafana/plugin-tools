---
id: add-component
title: addComponent()
description: This method can be used to register a React component to a certain extension point to contribute a new ui experience.
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
sidebar_position: 20
---

# `addComponent(config)`

**Available in Grafana >=v11.1.0.**

This method can be used to register a [React component](https://react.dev/learn/your-first-component) to a certain extension point to contribute a new ui experience.

```typescript
export const plugin = new AppPlugin<{}>().addComponent({
  targets: ['grafana/user/profile/tab'],
  title: 'New user profile tab',
  description: 'A new tab that shows extended user profile information',
  component: () => {
    return <div>Hello World!</div>;
  },
});
```

## Parameters

The `addComponent()` method takes a single `config` object with the following properties:

| Property          | Description                                                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`targets`**     | A list of extension point IDs where the extension will be registered. <br /> _Example: `"grafana/dashboard/panel/menu"`. [See available extension points in Grafana &rarr;](#available-extension-points-within-grafana)_ |
| **`title`**       | A human readable title for the component.                                                                                                                                                                                |
| **`description`** | A human readable description for the component.                                                                                                                                                                          |
| **`component`**   | The [React component](https://react.dev/learn/your-first-component) that will be rendered by the extension point. Note: the props passed to the component are defined by each extension point.                           |

## Return value

The method returns the `AppPlugin` instance to allow for chaining.

## Examples

- [Best practices for adding components](../../tutorials/ui-extensions/register-an-extension.md#best-practices-for-adding-components)
- [Accessing plugin meta-data in the component](../../tutorials/ui-extensions/register-an-extension.md#accessing-plugin-meta-in-a-component)
- [Access your plugin's state inside the component](../../tutorials/ui-extensions/register-an-extension.md#access-plugin-state-in-a-component)
- [Hide a component in certain conditions](../../tutorials/ui-extensions/register-an-extension.md#hide-a-component-in-certain-conditions)
