---
id: ui-extensions
title: Introduction to UI Extensions
description: Learn how to add links and trigger actions from the Grafana user interface by using UI Extensions in app plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - links
  - extensions
  - app plugins
---

App plugins are able to leverage an extension framework in Grafana to contribute new actions and functionality to the core Grafana UI, and other App plugins.

## Definition of terms

Before we go into details we need to cover the two major concepts in the UI extensions framework.

1. `Extension point` - a place in the UI where plugins can contribute new functionality to the end user. The Grafana UI exposes extension points and App plugins can also define their own extension points.
2. `Extension` - new functionality, registered by an app plugin, that will be displayed at an extension point. An extension could provide a navigational link to bring users to a particular view; it could open a modal menu allowing the user to configure an action to take from within their current context i.e. to create a SLO; or it could trigger background tasks.

![panel menu](https://user-images.githubusercontent.com/172951/242723354-a10d6238-22f1-4458-b85e-ac3c7f014b22.png)

In the example above we have one extension point with three extensions registered. This highlights one of the benefits of using UI extensions. Once you have added an extension point to your UI it can be extended multiple times by multiple plugins.

## Why should I add an extension point?

App plugins can provide custom pages in the Grafana UI, often highly contextualised to a particular service or task to enable users to be productive. Grafana is a feature-rich observability platform and has an extensive ecosystem of plugins, allowing users to monitor and act upon a wide set of data. Extension points facilitate the breaking down of silos between individual views, allowing users to quickly leverage data from their current context to take relevant actions. By providing extension points within your app, relevant extensions can easily offer new capabilities to your shared users.

Adding an extension point to your UI gives a number of benefits such as:

- Define the UI extension point once to enable multiple plugins to extend your UI with new functionality. No additional effort needed to provide  functionality from more plugins in your UI.
- Clean separation of concerns. Your application does not need to know anything about the plugin extending your UI.
- Integration build for change. Since your application doesn't know anything about the internals of the plugin extending your UI they are free to change their APIs without risk of breaking the extension point UI.
- Easy to bootstrap. If both apps are installed and enabled the extensions will automatically be configured and displayed to the user.
- Extensions are fast. We pre build the extensions registry at Grafana boot time which makes it fast to use while rendering the UI.

Examples where it would be useful:

- The user views a dashboard with historical data. By adding an extension point to this part of the UI the Machine Learning app plugin can give the user the ability to create a forecast for that data directly from the panel.
- The user views a firing alert. By adding an extension point to this part of the UI the Incident app plugin can give the user the ability to create an incident directly from the alert view.

## Further Instructions

- [Learn how to create an extension point](./create-an-extension-point.md)
- [Learn how to register an extension from your app plugin](./register-an-extension.md)