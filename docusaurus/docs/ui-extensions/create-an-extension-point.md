---
id: create-an-extension-point
title: Create an extension point in your App plugin
sidebar_label: Create an extension point
sidebar_position: 2
description: Learn how to provide an extension point so that other applications can contribute their extensions.
keywords:
  - grafana
  - plugins
  - plugin
  - links
  - extensions
  - extension point
  - app plugins
---

There are a couple of things you need to consider when adding an extension point to your UI.

The first one is to define an extension point ID. It is basically just a string describing the part of the UI where the extension point lives. Extension developers should be able to figure out where in the UI the extension will be added by reading the extension point ID.

:::note

Extension points living in core Grafana should start with `grafana/` and extension points living in plugins should start with `/plugins` followed by the plugin id e.g. `plugins/<PLUGIN_ID>/`.

:::

The second thing you need to consider is how to design the UI of the extension point so it supports a scenario where multiple extensions are being added without breaking the UI.

Lastly you need to consider if there are any information from the current view that should be shared with the extensions added to the extension point. It could be information from the current view that could let the extending plugin prefill values etc in the functionality being added via the extension.









Lastly you need to call the `getPluginExtensions` with your extension point ID to receive the list of configured extensions for your extension point.

```typescript
const extensionPointId = 'plugins/myorg-extensionpoint-app/toolbar/actions';
const context: AppExtensionContext = {
  // Add information that should be shared with the extensions to this object.
};

const { extensions } = getPluginExtensions({
  extensionPointId,
  context,
});
```