---
id: ui-extensions-concepts
title: Understand UI extensions
sidebar_label: Key concepts
description: Learn the core concepts behind UI extensions in Grafana and how they enable plugins to interact with each other.
keywords:
  - grafana
  - plugins
  - plugin
  - links
  - extensions
  - app plugins
  - extension points
  - components
sidebar_position: 60
---

UI extensions are a powerful feature that allows your app plugin to integrate seamlessly with the Grafana UI and with other plugins. They provide a structured way to contribute content (like links and components) to specific areas of the Grafana interface, or to share reusable components with other plugins.

This guide covers the fundamental concepts of the UI extensions ecosystem.

## The core idea 

The UI extensions feature is built around a few key concepts:

- **Content providers**: App plugins that offer content (links, components, or functions).
- **Content consumers**: The parts of Grafana or other plugins that use provided content.
- **Extension points**: The specific locations in the UI where content can be placed.

As a plugin developer, you can act both as a provider and/or a consumer of content.

## Two ways to share content: `add` vs. `expose`

There are two distinct methods for sharing content from your plugin, based on different developer intentions:

1.  **`add` (Registering):** A "push" method where you decide exactly where your content appears.
2.  **`expose` (Exposing):** A "pull" method where you offer a component for other plugins to use as they see fit.

Let's break down the differences.

### `add`: Push content to extension points

Use the `add` method when you want to place your content in a specific, predefined location. With this approach, you are actively "pushing" your content into a known slot in the Grafana UI.

- **Your role (producer):** You create a link or a component and register it to a specific extension point, such as a panel menu or a navigation bar.
- **The host's role (consumer):** The owner of the extension point (Grafana or another plugin) receives all the registered content and decides how to display it. The consumer doesn't know in advance who will contribute content.

![Add APIs flow](./images/ui-extensions-add-flow.svg)

#### Use cases 

This approach allows you to tightly integrate your plugin's functionality into the existing Grafana UI. For example:

- Adding a menu item to the Grafana panel menu.
- Adding a new tab to a page in Grafana.
- Contributing a button to a dashboard toolbar.

### `expose`: Let others pull your content

Use the `expose` method when you want to provide a generic, reusable component that other plugins can "pull" into their own UI. You make the component available, and then it's up to other developers to decide if and how to use it.

- **Your role (producer):** You expose a component, making it available by a unique ID. You don't know who will use it or where it will be displayed.
- **The user's role (consumer):** Another plugin developer can find your exposed component and choose to render it anywhere within their own plugin's interface.

![Expose APIs flow](./images/ui-extensions-expose-flow.svg)

#### Use cases 

This approach facilitates creating a library of shared components and promoting reusability across the plugin ecosystem. For example:

- Creating a unique data visualization that other datasource plugins could use.
- Building a custom form field or input control for other plugins to use in their configuration pages.
- Offering a complex UI widget, like an incident declaration modal, that can be triggered from anywhere.

### Summary of differences

| Feature          | `add` (Registering)                                       | `expose` (Exposing)                                         |
| :--------------- | :-------------------------------------------------------- | :---------------------------------------------------------- |
| **Intent**       | Push content to a specific location.                       | Let others pull content to use anywhere.                     |
| **Control**      | You (the producer) choose the location (extension point). | The consumer chooses the location.                          |
| **Awareness**    | The consumer discovers producers at runtime.              | The consumer knows which producer it's using.               |
| **Relationship** | One-to-many (one extension point, many contributors).     | One-to-one (one exposed component, one consumer at a time). |
| **Use case**     | Integrating into specific UI locations.                   | Providing a library of reusable components.                 |

## Get started

Now that you understand the core concepts, here's how you can start working with UI extensions:

### As a content provider (sharing from your plugin)

If you want to share links or components from your app plugin, you have two paths:

- [**Register an extension**](./register-an-extension.md): Learn how to `add` your content to a specific extension point.
- [**Expose a component**](./expose-a-component.md): Learn how to `expose` a reusable component for other plugins to use.

### As a content consumer (using extensions in your plugin)

If you want to use content from other plugins, you can:

- [**Create an extension point**](./create-an-extension-point.md): Learn how to allow other plugins to `add` content into your plugin's UI.
- [**Use an exposed component**](./use-an-exposed-component.md): Learn how to find and render an `exposed` component from another plugin in your UI.

## Further reading

- [**Available extension points**](../../reference/ui-extensions-reference/extension-points.md): See a list of all the extension points available in Grafana Core.
- [**Versioning extensions**](./versioning-extensions.md): Best practices for versioning your exposed components and extension points.
- [**Debugging extensions**](./debug-logs.md): Learn how to use logs to troubleshoot your extensions.
- [**API reference**](../../reference/ui-extensions-reference/ui-extensions.md): A detailed look at the UI extensions API.
