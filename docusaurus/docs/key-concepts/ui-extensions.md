---
id: ui-extensions
title: UI extensions
description: Learn how to add links and trigger actions from the Grafana user interface by using UI Extensions in app plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - links
  - extensions
  - app plugins
  - extension points
  - components
  - content
sidebar_position: 60
---

Use UI extensions to contribute new actions and functionality to the core Grafana UI and other app plugins. 

## Understand the extensions ecosystem

The UI extensions framework is built around these concepts:

- **Extension point**: A place in Grafana Core or in a plugin where content can be hooked into.

- **Renderable content**: Functionality (link or component) made available to render in an extension point, or a component exposed to be used by another plugin.

- **Exposed component**: Component made available to other plugins with the `expose*` APIs. If exposed, a component is not tied to extension points.

- **Registered content**: Links or components made available with the `add*` APIs. If registered, content can be rendered in specific extension points.

- **Content provider**: The app plugin providing the content (link or component) to be rendered at the extension point. 

- **Content user**: The extension point using the renderable content.

- **Plugin developer**: A developer working with the Grafana plugins ecosystem.

## I want to render extension content 

As a content user, you can either use exposed components or render content (links or components) made available by content providers in an extension point.

### Why add an extension point?

Define extension points to add new capabilities:

- An extension point allows other plugins to extend your UI with new functionality. You don't need any additional effort to provide functionality from other plugins in your UI.
- Clean separation of concerns. Your application doesn't need to know anything about the plugin extending your UI.
- Easy to bootstrap. If both apps are installed and enabled, then the extensions are automatically configured and displayed for your user. There is no need for either app to include custom logic to detect the presence of the other.

### Where can I find the my extension points?

![Panel menu showing available extensions](/img/ui-extensions-menu.png)

In the example above, the Grafana Core extension point renders two links from the Machine Learning plugin: Outlier detection and Create forecast.

### Next steps

- [Learn how to create an extension point](../how-to-guides/ui-extensions/create-an-extension-point.md)
- [Learn how to use exposed components](../how-to-guides/ui-extensions/use-an-exposed-component.md)

## I want to share content from my app plugin

If you’re a plugin developer and want other plugins or Grafana Core to render links or components from your app plugin, you need to either register or expose your content first. 

### Use cases

You can make your content available to extension points in situations such as:

- You want to show a link in a specific place in Grafana Core
- You want another plugin to link to a specific page in your App
- You want another plugin to show a widget from your app in their page 

### Next steps

- [Learn how to register an extension to an extension point](../how-to-guides/ui-extensions/register-an-extension.md)
- [Learn how to expose components from a plugin so other plugins can import them](../how-to-guides/ui-extensions/expose-a-component.md)

## Further reading

- [Learn how to version exposed components and extension points](../how-to-guides/ui-extensions/versioning-extensions.md)
- [Check the API reference guide](../reference/ui-extensions.md)
- If you need to debug your extension see [Use logs to debug your extension](../how-to-guides/ui-extensions/debug-logs.md)
