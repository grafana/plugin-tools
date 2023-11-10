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

Providing an extension point within your UI enables other plugins to contribute supplementary capabilities, and leverage the context within the current view to guide users to a potential next step. Here's what you need to know about extension points.

Firstly, you will need to define an extension point ID. This is basically just a string describing the part of the UI where the extension point lives. Extension developers should be able to figure out where in the UI the extension will be added by reading the extension point ID.

:::note

Extension points living in core Grafana must start with `grafana/` and extension points living in plugins must have IDs starting with `plugins/` followed by the plugin ID, for example, `plugins/<PLUGIN_ID>/`.

:::

The second thing you need to consider is how to design the UI of the extension point so it supports a scenario where multiple extensions are being added without breaking the UI.

Finally, consider if there is any information from the current view that should be shared with the extensions added to the extension point. It could be information from the current view that could let the extending plugin prefill values or other data in the functionality being added via the extension.

## Create an extension point

Use the `getPluginLinkExtensions` method in `@grafana/runtime` to create an extension point within your plugin.

:::danger

When you create an extension point in a plugin, you create a public interface for other plugins to interact with. Changes to the extension point ID or its context could break any plugin that attempts to register a link inside your plugin.

:::

The `getPluginLinkExtensions` method takes an object consisting of the `extensionPointId`, which must begin `plugins/<PLUGIN_ID>`, and any contextual information that you want to provide. The `getPluginLinkExtensions` method returns a list of extension links that your program can then loop over.

In the following example, a `<LinkButton />`-component is rendered for all link extensions that other plugins registered for the `plugins/another-app-plugin/menu` extension point ID. The context is passed as the second parameter to `getPluginLinkExtensions`, which makes the context immutable before passing it to other plugins.

```tsx
import { getPluginLinkExtensions } from '@grafana/runtime';
import { LinkButton } from '@grafana/ui';

function AppMenuExtensionPoint() {
  const { extensions } = getPluginExtensions({
    extensionPointId: 'plugins/another-app-plugin/menu',
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
          <LinkButton
            href={extension.path}
            onClick={extension.onClick}
            title={extension.description}
            key={extension.key}
          >
            {extension.title}
          </LinkButton>
        );
      })}
    </div>
  );
}
```

#### Why does the extension have `onClick` and `path`?

Each extension link has either a `path` or an `onClick` property defined. There's never a scenario where both properties are defined at the same time.

The reason for this behavior is that we want to be able to support both native browser links and callbacks. If the plugin adding the extension wants to navigate the user away from the current view into their app, then they can choose to define a path.

If instead you want to open a modal or trigger a background task without sending the user away from the current page, then you can provide a callback.

## Additional options

If you want to limit how many extensions a plugin can register for your extension point, you can pass the `limitPerPlugin` option as part of the `getPluginLinkExtensions` call. The default limit is set to five extensions per plugin to prevent plugins from flooding your extension point.
