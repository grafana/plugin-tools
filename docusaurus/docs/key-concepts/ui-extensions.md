---
id: ui-extensions
title: UI extensions
sidebar_label: UI extensions key concepts
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

- **Registered content**: Links, components or functions made available with the `add*` APIs. If registered, content can be rendered in specific extension points.

- **Content provider**: The app plugin providing the content (link or component) to be rendered at the extension point.

- **Content consumer**: The extension point using the renderable content.

- **Plugin developer**: A developer working with the Grafana plugins ecosystem.

## Expose APIs vs Add APIs

Grafana’s **UI extensions** allow plugins to share and consume UI components, links, or functionality in a flexible way.  
As a content producer, you can either **expose** your content to all consumers or **add** your content to a specific extension point.

- **Expose APIs**: Used when an app plugin or Grafana wants to **broadcast** a component, function, or link so that any app plugin can consume it.
- **Add APIs**: Used when an app plugin wants to **contribute** a component, function, or link to a **specific extension point** provided by Grafana or another app plugin.

### Expose APIs

Use **expose APIs** when you want to make something available **broadly**, without knowing in advance who will consume it.

- **Producer perspective:** App plugins or Grafana publish (expose) a component, function, or link so that **any app plugin** can discover and consume it.
- **Consumer perspective:** Only app plugins can consume exposed content. They know exactly which producer it comes from.

:::tip  
 Think of this as **broadcasting** content.
:::

**Example use cases:**

- Exposing a workflow that opens a modal to declare an incident directly from any plugin.
- Exposing a rich component that other plugins may embed on a tab.

#### Expose APIs flow

![Expose APIs flow](./images/ui-extensions-expose-flow.svg)  
_Producers (Grafana or app plugins) broadcast components or functions that any app plugin can consume._

### Add APIs

Use **add APIs** when you want to contribute something to a **specific place or extension point**.

- **Producer perspective:** App plugins add components, links, or functions into a well-defined extension point.
- **Consumer perspective:** Grafana or app plugins act as consumers by providing extension points that gather multiple contributions.

:::note  
 Think of this as **plugging into a defined slot**.
:::

**Example use cases:**

- Adding a menu item into Grafana’s panel menu.
- Adding a tab with content to a page in Grafana.

#### Add APIs flow

![Add APIs flow](./images/ui-extensions-add-flow.svg)  
_Producers (app plugins) contribute to extension points owned by Grafana or other plugins. Multiple producers can add content, and the consumer decides how it is used._

### Control and Awareness

In both **Expose APIs** and **Add APIs**, the **consumer always controls placement and usage**.  
The difference lies in how much the consumer knows about the producer and the content it receives:

- **Expose APIs**
  - Consumers know **which producer** the component or function comes from.
  - They receive a **single component/function** to consume.
  - Acts like a **direct contract** between one producer and one consumer.

- **Add APIs**
  - Consumers do **not know ahead of time** who the producers are.
  - They receive a **list of multiple components/functions/links** from different producers.
  - Only after receiving the list do they know which producers contributed.
  - Acts like a **collection point** where multiple producers contribute to a single consumer-owned extension point.

## I want to render extension content

As a content consumer, you can either use exposed components or render content (links or components) made available by content providers in an extension point.

### Why add an extension point?

Define extension points to add new capabilities:

- An extension point allows other plugins to extend your UI with new functionality. You don't need any additional effort to provide functionality from other plugins in your UI.
- Clean separation of concerns. Your application doesn't need to know anything about the plugin extending your UI.
- Easy to bootstrap. If both apps are installed and enabled, then the extensions are automatically configured and displayed for your user. There is no need for either app to include custom logic to detect the presence of the other.

### Where can I find extension points?

![Panel menu showing available extensions](/img/ui-extension-example.gif)

In the example above, the Grafana Core extension point `"grafana/dashboard/panel/menu"` is rendering links registered by plugins. [Check out all available extension points in Grafana Core.](../reference/ui-extensions-reference/extension-points.md)

### Next steps

- [Learn how to create an extension point](../how-to-guides/ui-extensions/create-an-extension-point.md)
- [Learn how to use exposed components](../how-to-guides/ui-extensions/use-an-exposed-component.md)
- [Avoid UI issues when working with extension points](../how-to-guides/ui-extensions/degregate-ui.md)

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
- [Check the API reference guide](../reference/ui-extensions-reference/ui-extensions.md)
- If you need to debug your extension see [Use logs to debug your extension](../how-to-guides/ui-extensions/debug-logs.md)
