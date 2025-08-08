---
id: extensions-add-expose
title: Understand when to add or expose elements in Extensions
description: Learn when to add and when to expose en element to an extension point.
keywords:
  - grafana
  - plugins
  - documentation
  - API reference
  - API
  - extensions
sidebar_position: 10
---

Read on to understand when to use `add*` vs `expose*` APIs when developing Extensions in Grafana. This document explains their purpose and provides guidelines on when to use each approach.

## Overview: When to use which API?

Follow these guidelines to create flexible and maintainable UI extensions in Grafana that work seamlessly across plugins.

| Scenario      | Use add* APIs          | Use expose* APIs |
| -------------- | ------------------ | -------- |
| Allow multiple plugins to contribute UI elements | ✅ |  ❌  |
| Add to an existing extension point | ✅ |  ❌  |
| Share a reusable component/function | ❌ |  ✅ |
| Consume a component/function from another plugin | ❌ |  ✅ |

## Using `add*` APIs

Use the `add*` APIs when you want to enable multiple plugins to extend or contribute to a specific UI area. This allows for dynamic extensibility without direct dependencies between plugins. 

For example:

- When creating an extension point, use `add*` when you want to allow other plugins to hook into your UI by adding links, components, or other elements.
- When contributing to an existing extension point, use `add*` when you want your plugin to add UI elements to an existing extension point in Grafana Core or another plugin.

### Examples

#### Defining an extension point

A plugin defining an extension point where other plugins can contribute components:

```typescript
import { addPanelEditorTab } from '@grafana/data';
addPanelEditorTab('Custom Tab', MyCustomTabComponent, 'advanced');
```

Here, other plugins can register their own components into the panel editor using this extension point.

#### Adding a component to an existing extension point

A plugin adding its own component to an existing extension point:

```typescript
import { addMenuItem } from '@grafana/data';
addMenuItem({
id: 'my-plugin-item',
title: 'My Plugin',
onClick: () => console.log('Clicked!'),
});
```

In this case, the plugin contributes a menu item to a known extension point.

## Using `expose*` APIs

Use the `expose*` APIs when you want to make components or functions available for other plugins to reuse, without requiring your plugin to directly depend on the consuming plugin. 

For example:

- When sharing reusable components or functions, use `expose*` when you have a UI component or utility function that should be available for other plugins to use.
- When consuming an exposed component or function, use `expose*` when you want to import and use a component or function from another plugin.

### Examples

#### Exposing a component

A plugin exposing a UI component for others to use:

```typescript
import { exposeComponent } from '@grafana/data';
exposeComponent('my-plugin/MyCustomComponent', MyCustomComponent);
```

Now other plugins can consume this component without any direct dependency.

#### Consuming an exposed component

A plugin consuming an exposed component from another plugin:

```typescript
import { getExposedComponent } from '@grafana/data';
const MyCustomComponent = getExposedComponent('my-plugin/MyCustomComponent');
```

This allows the consuming plugin to dynamically load and use the component.



