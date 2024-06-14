---
id: use-plugin-component
title: usePluginComponent()
description: This react hook can be used to fetch a single react component that was exposed by a plugin with a unique ID.
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
sidebar_position: 60
---

# `usePluginComponent(id)`

:::info
Available in Grafana >=v11.1.0.
:::

This react hook can be used to **fetch a single react component** that was exposed by a plugin with a unique ID. Plugins can expose components using the [`AppPlugin.exposeComponent()`](./exposeComponent.md) method.

```typescript
import { usePluginComponent } from '@grafana/runtime';

const { component: Component, isLoading } = usePluginComponent('myorg-incidents-app/create-incident-form');
```

## Parameters

- **`id`** - A unique id that identifies the component.

## Return value

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

## Examples

- [How to render a component exposed by another plugin?](../../tutorials/ui-extensions/use-an-exposed-component.md#using-an-exposed-component)
