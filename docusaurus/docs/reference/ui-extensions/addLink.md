---
id: add-link
title: .addLink()
description: This method can be used to register a link extension to a certain extension point.
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
sidebar_position: 10
---

# `.addLink(config)`

**Available in Grafana >=v11.1.0.**

This method can be used to register a link extension to a certain extension point. Link extensions are used to navigate to different parts of the Grafana UI or other plugins, and can include modal elements declared via an onClick.

```typescript
export const plugin = new AppPlugin<{}>().addLink({
  targets: ['grafana/dashboard/panel/menu'],
  title: 'Declare incident',
  description: 'Declare an incident and attach the panel context to it',
  path: '/a/myorg-incidents-app/incidents',
});
```

## Parameters

The `.addLink()` method takes a single `config` object with the following properties:

| Property          | Description                                                                                                                                                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`targets`**     | A list of extension point IDs where the extension will be registered. <br /> _Example: `"grafana/dashboard/panel/menu"`. [See available extension points in Grafana &rarr;](#available-extension-points-within-grafana)_                        |
| **`title`**       | A human readable title for the link.                                                                                                                                                                                                            |
| **`description`** | A human readable description for the link.                                                                                                                                                                                                      |
| **`path?`**       | _(Optional)_ A path within your app plugin where you would like to send users when they click the link. <br /> _Example: `"/a/myorg-incidents-app/incidents"`_                                                                                  |
| **`onClick?`**    | _(Optional)_ A callback that should be triggered when the user clicks the link.                                                                                                                                                                 |
| **`category?`**   | _(Optional)_ A category that should be used to group your link with other links.                                                                                                                                                                |
| **`icon?`**       | _(Optional)_ An icon that should be used while displaying your link. <br /> _Example: `"edit"` or `"bookmark"`. [See all available icon names &rarr;](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/icon.ts#L1)_ |
| **`configure?`**  | _(Optional)_ A function that is called prior to displaying the link which enables you to dynamically change or hide your link depending on its `context`.                                                                                       |

## Return value

The method returns the `AppPlugin` instance to allow for chaining.

## Examples

- [Best practices for adding links](../../tutorials/ui-extensions/register-an-extension.md#best-practices-for-adding-links)
- [Hide a link in certain conditions](../../tutorials/ui-extensions/register-an-extension.md#hide-a-link-in-certain-conditions)
- [Update the path based on the context](../../tutorials/ui-extensions/register-an-extension.md#update-the-path-based-on-the-context)
- [Open a modal from the `onClick()`](../../tutorials/ui-extensions/register-an-extension.md#open-a-modal-from-the-onclick)
