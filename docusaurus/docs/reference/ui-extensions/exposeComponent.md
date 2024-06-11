---
id: expose-component
title: .exposeComponent()
description: This method is exposing a React component and makes it available for other plugins to use.
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
sidebar_position: 30
---

# `.exposeComponent(config)`

**Available in Grafana >=v11.1.0.**

This method is exposing a React component and makes it available for other plugins to use. (Any other plugin that knows the `id` can get hold of the exposed component and render it somewhere in their app.)

```typescript
export const plugin = new AppPlugin<{}>()
    .exposeComponent({
        id: "myorg-incidents-app/create-incident-form",],
        title: "Create incident form",
        description: "A form to create a new incident.",
        component: () => {
            return <div>Hello World!</div>;
        },
    });
```

## Parameters

The `.exposeComponent()` method takes a single `config` object with the following properties:

| Property          | Description                                                                                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`id`**          | A unique string identifier of the component you are exposing. **It must be prefixed with your plugin ID.** <br /> _E.g.: `"myorg-incidents-app/create-incident-form"`._                                                                     |
| **`title`**       | A human readable title for the component.                                                                                                                                                                                                   |
| **`description`** | A human readable description for the component.                                                                                                                                                                                             |
| **`component`**   | A React component that you are exposing. <br /> _Make sure to wrap it with the necessary React context providers that the component is relying on, as this component is not going to be rendered under the same React tree as your plugin._ |

## Return value

The method returns the `AppPlugin` instance to allow for chaining.

## Examples

- [Best practices for exposing components](../../tutorials/ui-extensions/exposed-components.md#best-practices)
- [Access plugin meta information in an exposed component](../../tutorials/ui-extensions/exposed-components.md#access-plugin-meta-information-in-an-exposed-component)
