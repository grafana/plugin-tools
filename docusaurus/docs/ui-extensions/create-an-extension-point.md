---
id: create-an-extension-point
title: Create an extension point in your app plugin
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
 - apps
---

When you want your plugin to insert links to a specific location in another plugin's UI, use an extension point. Here's what you need to know about extension points.

Firstly, you will need to define an extension point ID. This is basically just a string describing the part of the UI where the extension point lives. Extension developers should be able to figure out where in the UI the extension will be added by reading the extension point ID.

:::note

Extension points living in core Grafana should start with `grafana/` and extension points living in plugins should have IDs starting with `/plugins` followed by the plugin ID, for example, `plugins/<PLUGIN_ID>/`.

:::

The second thing you need to consider is how to design the UI of the extension point so it supports a scenario where multiple extensions are being added without breaking the UI.

Lastly you need to consider if there are any information from the current view that should be shared with the extensions added to the extension point. It could be information from the current view that could let the extending plugin prefill values etc in the functionality being added via the extension.


## How to create an extension point

Use the `getPluginLinkExtensions` method in `@grafana/runtime` to create an extension point within your plugin.

:::note

Creating an extension point in a plugin creates a public interface for other plugins to interact with. Changes to the extension point ID or its context could break any plugin that attempts to register a link inside your plugin.

:::

The `getPluginLinkExtensions` method takes an object consisting of the `extensionPointId`, which must begin `plugin/<PLUGIN_ID>`, and any contextual information that you want to provide. The `getPluginLinkExtensions` method returns a list of extension links that your program can loop over


```typescript
import { getPluginLinkExtensions } from '@grafana/runtime';
import { LinkButton } from '@grafana/ui';

function AppMenuExtensionPoint() {
  const { extensions } = getPluginExtensions({
    extensionPointId: 'plugin/another-app-plugin/menu',
    context: {
      referenceId: '12345',
      timeZone: 'UTC',
    },
  });

  if (extensions.length === 0) {
    return null;
  }

  return (
    <div>
      {extensions.map((extension) => {
        return (
          <LinkButton href={extension.path} onClick={extension.onClick} title={extension.description} key={extension.key}>
            {extension.title}
          </LinkButton>
        );
      })}
    </div>
  );
}
```

The preceding example shows a component that renders <LinkButton /> components for all link extensions that other plugins registered for the `plugin/another-app-plugin/menu` extension point ID. The context is passed as the second parameter to `getPluginLinkExtensions`, which will make the context immutable before passing it to other plugins.

#### Why does the extension has onClick and path?
Each extension link has either an `path` or `onClick` property defined. There will never be a scenario where both properties are defined at the same time.

The reason for this is to be able to support both native browser links and callbacks. If the plugin, adding the extension, want to navigate the user away from the current view into their app they can choose to define a path.

If the instead would like to e.g. open a modal or trigger a background task (without navigating the user away from the current page) they can provide a callback.

## Additional options

If you would like to limit how many extensions a plugin can register for your extension point you can pass the `limitPerPlugin` option as part of the `getPluginLinkExtensions` call. The default limit is set to **5** extensions per plugin to prevent plugins from flooding your extension point.