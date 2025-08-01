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
sidebar_position: 60
---

Use UI extensions to contribute new actions and functionality to the core Grafana UI and other app plugins. 

## Understand extensions

The UI extensions framework is built around these concepts:

1. `Extension point` - A place in the UI where plugins can contribute new functionality to the end user. Both the Grafana UI and app plugins can expose extension points. 
2. `Extension` - New functionality you register to an extension point. For example, an extension can provide a navigational link to bring users to a particular view, open a modal menu allowing the user to configure an action to take from within their current context (for instance, to create a SLO), or trigger background tasks. There are three types of extensions: links, components, and functions.
3. `Exposed component` - A component from an app plugin you can expose to easily share functionality with other app plugins without having to register to an extension point.  

After you have added an extension point to your UI you can extend it multiple times by multiple plugins.

## Where can I find extensions?

![Panel menu showing available extensions](/img/ui-extensions-menu.png)

In the example above, there is one extension point with three registered extensions: Machine learning, Outlier detection, and Create forecast. 

## Why should I add an extension point?

App plugins can provide custom pages in the Grafana UI, often highly contextualized to a particular service or task to enable users to be productive. Grafana is a feature-rich observability platform and has an extensive ecosystem of plugins, allowing users to monitor and act upon a wide set of data.

Extension points facilitate the breaking down of silos between individual views, allowing users to quickly leverage data from their current context to take relevant actions. By providing extension points within your app, relevant extensions can easily offer new capabilities to your shared users.

Adding an extension point to your UI provides the following benefits:

- Define the UI extension point once to enable multiple plugins to extend your UI with new functionality. You don't need any additional effort to provide functionality from more plugins in your UI.
- Clean separation of concerns. Your application doesn't need to know anything about the plugin extending your UI.
- Integration built for change. Since your application doesn't know anything about the internal workings of the plugin extending your UI, they are free to change their APIs without the risk of breaking the extension point UI.
- Easy to bootstrap. If both apps are installed and enabled, then the extensions are automatically configured and displayed to the user. There is no need for either app to include custom logic to detect the presence of the other.
- Extensions are fast. We pre-build the extensions registry at Grafana boot time which makes it fast to use while rendering the UI.

### Use cases

You can use extensions for the following scenarios:

- The user views a dashboard with historical data. By adding an extension point to this part of the UI, a machine learning app plugin can give the user the ability to create a forecast for that data directly from the panel.
- The user views a firing alert. By adding an extension point to this part of the UI, an Incident app plugin can give the user the ability to create an incident directly from the alert view.

## Further instructions

- [Learn how to create an extension point](../how-to-guides/ui-extensions/create-an-extension-point.md)
- [Learn how to register an extension to an extension point](../how-to-guides/ui-extensions/register-an-extension.md)
- [Learn how to expose components from a plugin so other plugins can import them](../how-to-guides/ui-extensions/expose-a-component.md)
- [Learn how to use exposed components](../how-to-guides/ui-extensions/use-an-exposed-component.md)
- [Learn how to version exposed components and extension points](../how-to-guides/ui-extensions/versioning-extensions.md)
- [Check the API reference guide](../reference/ui-extensions.md)
