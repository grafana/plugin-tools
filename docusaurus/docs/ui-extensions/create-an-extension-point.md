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

:::danger

When you create an extension point in a plugin, you create a public interface for other plugins to interact with. Changes to the extension point ID or its context could break any plugin that attempts to register a link inside your plugin.

:::

You can easily create an extension point using the following functions (they live in `@grafana/runtime`) to fetch extensions for a certain extension point ID:

### `getPluginExtensions()` - _deprecated_

The `getPluginExtensions` method takes an object consisting of the `extensionPointId`, which must begin `plugins/<PLUGIN_ID>`, and any contextual information that you want to provide. The `getPluginLinkExtensions` method returns a list of extension links that your program can then loop over.

#### Syntax

```tsx
getPluginExtensions(options);
getPluginLinkExtensions(options); // Only returns extensions that have type `type="link"`
getPluginComponentExtensions(options); // Only returns extensions that have type `type="component"`
```

#### Parameters

##### `options.extensionPointId` - _string_

The unique identifier of your extension point. It must begin with `plugins/<PLUGIN_ID>`, for example: `plugins/myorg-super-app`.

##### `options?.context` - _object (Optional)_

An arbitrary object, that contains information related to your extension point which you would like to share with the extensions, for example: `{ baseUrl: '/foo/bar' }`. This parameter is not available for component extensions, for those you can pass contextual information using the component props. **Note:** the provided context object always gets frozen (turned immutable) before being shared with the extensions.

##### `options?.limitPerPlugin` - _number (Optional)_

It can be used to limit maximum how many extensions should be returned from the same plugin. It can be useful in cases when there is limited space on the UI to display extensions.

#### Return value

- `getPluginExtensions()` - returns a mixed list of [`PluginExtensionLink`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L27) and [`PluginExtensionComponent`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L35C13-L35C37)
- `getPluginLinkExtensions()` - returns a list of [`PluginExtensionLink`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L27)
- `getPluginComponentExtensions()` - returns a list of [`PluginExtensionComponent`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L35C13-L35C37)

#### Example - rendering link extensions

In the following example, a `<LinkButton />`-component is rendered for all link extensions that other plugins registered for the `plugins/another-app-plugin/menu` extension point ID.

```tsx
import { getPluginLinkExtensions } from '@grafana/runtime';
import { LinkButton } from '@grafana/ui';

function AppMenuExtensionPoint() {
  // This only returns type="link" extensions
  const { extensions } = getPluginLinkExtensions({
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

#### Example - rendering component extensions

:::note

**Available in Grafana >=10.1.0** <br /> (_Component type extensions are only available in Grafana 10.1.0 and above._)

:::

Component type extensions are simple React components, which gives much more freedom on what they are able to do. In case you would like to make some part of your plugin extendable by other plugins, you can create a component-type extension point using `getPluginComponentExtensions()`. Any contextual information can be shared with the extension components using the `context={}` prop (see the example below).

```tsx title="src/components/Toolbar.tsx"
import { getPluginComponentExtensions } from '@grafana/runtime';

export const Toolbar = () => {
  // This only returns type="component" extensions
  // Heads up! We don't specify a context object below, we pass in the contextual information as a prop to the component later.
  const { extensions } = getPluginComponentExtensions({ extensionPointId: '<extension-point-id>' });
  const version = '1.0.0'; // Let's share this with the extensions

  return (
    <div>
      <div className="title">Title</div>
      <div className="extensions">
        {/* Loop through the available extensions */}
        {extensions.map((extension) => {
          const Component = extension.component as React.ComponentType<{
            context: { version: string };
          }>;

          // Render extension component and pass contextual information (version)
          return (
            <div key={extension.id}>
              <Component context={{ version }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
```
