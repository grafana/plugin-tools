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

- `Extension point`: A place in the Grafana UI or in a plugin where new content can be rendered via hooks. 
- `Renderable content`: New functionality (link or component) made available at an extension point by the content provider to the content user. For example, a navigational link to bring users to a particular view, open a modal menu allowing the user to configure an action to take from within their current context (for instance, to create a SLO), or trigger background tasks. 
- `Content provider`: The plugin providing the content to be rendered from the extension point.
- `Content user`: The extension point using the renderable content.

## Working with extensions as a content user 

As a content user, you need to create an extension point in your Grafana UI or your plugin to be able to access new extended functionality made available by content providers.

### Where can I find extensions?

![Panel menu showing available extensions](/img/ui-extensions-menu.png)

In the example above, your extension point is connected to three functionalities: Machine learning, Outlier detection, and Create forecast. 

### Why should I add an extension point?

Extension points facilitate the breaking down of silos between individual views, allowing users to quickly leverage data from their current context to take relevant actions. By providing extension points within your app, relevant extensions can easily offer new capabilities to your shared users.

Adding an extension point to your UI provides the following benefits:

- Define the UI extension point once to enable multiple plugins to extend your UI with new functionality. You don't need any additional effort to provide functionality from more plugins in your UI.
- Clean separation of concerns. Your application doesn't need to know anything about the plugin extending your UI.
- Integration built for change. Since your application doesn't know anything about the internal workings of the plugin extending your UI, they are free to change their APIs without the risk of breaking the extension point UI.
- Easy to bootstrap. If both apps are installed and enabled, then the extensions are automatically configured and displayed to the user. There is no need for either app to include custom logic to detect the presence of the other.
- Extensions are fast. We pre-build the extensions registry at Grafana boot time which makes it fast to use while rendering the UI.

### Next steps

- [Learn how to create an extension point](../how-to-guides/ui-extensions/create-an-extension-point.md)
- [Learn how to use exposed components](../how-to-guides/ui-extensions/use-an-exposed-component.md)

## Working with extensions as a content provider 

As a content provider, you can extend links or components from your app plugin so that content end users can render them in their extension points. To do so you need to either register or expose the content first. 

### Use cases

You can make available your apps to extension points in the following situations: 

- The end user views a dashboard with historical data. If they add an extension point to this part of the UI, your machine learning app plugin can give them the ability to create a forecast for that data directly from the panel.
- The end user views a firing alert. If they an extension point to this part of the UI, an Incident app plugin can give them the ability to create an incident directly from the alert view.

### Next steps

- [Learn how to register an extension to an extension point](../how-to-guides/ui-extensions/register-an-extension.md)
- [Learn how to expose components from a plugin so other plugins can import them](../how-to-guides/ui-extensions/expose-a-component.md)

## Further reading

- [Learn how to version exposed components and extension points](../how-to-guides/ui-extensions/versioning-extensions.md)
- [Check the API reference guide](../reference/ui-extensions.md)
- If you need to debug your extension see [Use logs to debug your extension](../how-to-guides/ui-extensions/debug-logs.md).
