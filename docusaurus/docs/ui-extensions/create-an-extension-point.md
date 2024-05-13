---
id: create-an-extension-point
title: Create an extension point
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

In this guide you will learn how to provide an extension point so that app plugins can add their extensions to your plugin.

## What is an extension point?

An extension point is a place in the UI which you make extendable by other plugins using extensions. These extensions can either be links or React components that can implement virtually anything.

In the extension point you can control how you want to handle the displaying of extensions to users. You can also share contextual information with the extensions using a `context` object or component props. Refer to the examples below to learn more.

You can also share contextual information with the extensions using a `context` object or component props (see the following examples).

### Requirements

- **an extension point ID** _(string)_
  - In case it's an extension point in core Grafana, it must start with `grafana/`
  - In case it's inside a plugin, it must start with `plugin/<PLUGIN_ID>/`
  - It must be unique
- **an app plugin** - _apart from core Grafana, currently only app plugins can create extension points and register extensions._

:::note

When designing the UI make sure the extension point supports a scenario where multiple extensions can be added without breaking the UI. Also consider if there is any information from the current view that should be shared with the extensions added to the extension point. It could be information from the current view that could let the extending plugin pre-fill values or other data in the extension's functionality.

:::

## Create an extension point

:::danger

When you create an extension point in a plugin, you create a public interface for other plugins to interact with. Changes to the extension point ID or its context could break any plugin that attempts to register a link inside your plugin.

:::

You can easily create an extension point using the following functions (they live in `@grafana/runtime`) to fetch extensions for a certain extension point ID:

### The `usePluginExtensions()` hook {#usepluginextensions}

:::note

In case the `context` object is created dynamically, make sure to wrap it into a `useMemo()` to prevent unnecesssary rerenders. [More info](#example---rendering-link-extensions-dynamic-context)

:::

The `usePluginExtensions` React hooks return the list of extensions that are registered for a certain extension point ID. The hook dynamically updates its return value when the list of extensions changes. This behavior usually happens when extensions are registered during runtime due to dynamic plugin loading.

#### Syntax

```tsx
usePluginExtensions(options);
usePluginLinkExtensions(options); // Only returns extensions that have type `type="link"`
usePluginComponentExtensions(options); // Only returns extensions that have type `type="component"`
```

#### Parameters

##### `options.extensionPointId` - _string_

The unique identifier of your extension point. It must begin with `plugins/<PLUGIN_ID>` for plugins and `grafana/` for core Grafana extension points. For example: `plugins/myorg-super-app`.

##### `options?.context` - _object (Optional)_

An object containing information related to your extension point that you would like to share with the extensions. For example: `{ baseUrl: '/foo/bar' }`. This parameter is not available for component extensions, instead you should pass contextual information using the component props.

:::note

The provided context object is made immutable before being shared with the extensions.

:::

##### `options?.limitPerPlugin` - _number (Optional)_

Use this parameter to set the maximum value for how many extensions should be returned from the same plugin. It can be useful in cases when there is limited space on the UI to display extensions.

#### Return value

The hooks return an object in the following format:

```tsx
// usePluginExtensions()
{
  isLoading: boolean;
  extensions: Array<PluginExtensionLink | PluginExtensionComponent>
}

// usePluginLinkExtensions()
{
  isLoading: boolean;
  extensions: PluginExtensionLink[]
}

// usePluginComponentExtensions()
{
  isLoading: boolean;
  extensions: PluginExtensionComponent[]
}
```

(For more information check the type definitions of [`PluginExtensionLink`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L27) and [`PluginExtensionComponent`](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/pluginExtensions.ts#L35C13-L35C37).)

#### Example - rendering link extensions (static context)

The following example shows how to render a link component as link-type extensions that other plugins registered for the `plugins/another-app-plugin/menu` extension point ID.

```tsx
import { usePluginLinkExtensions } from '@grafana/runtime';

// We define the `context` outside of the React component for performance reasons.
// (Declaring it inside the component would result in a new object on every render,
// which would unnecessarily trigger the `usePluginLinkExtensions()` hook.)
const context = {
  referenceId: '12345',
  timeZone: 'UTC',
};

function AppMenuExtensionPoint() {
  // This only returns type="link" extensions
  const { extensions } = usePluginLinkExtensions({
    extensionPointId: 'plugins/another-app-plugin/menu',
    context,
  });

  if (extensions.length === 0) {
    return null;
  }

  return (
    <div>
      {extensions.map((extension) => {
        return (
          <a href={extension.path} onClick={extension.onClick} title={extension.description} key={extension.key}>
            {extension.title}
          </a>
        );
      })}
    </div>
  );
}
```

#### Example - rendering link extensions (dynamic context)

The following example shows how to create the context object dynamically. Although this is a common practice, you should be aware that the `usePluginLinkExtensions()` hook will re-render in the following scenarios:

- If the `context` object changes _(so the extensions can react to the context changes)_
- If the extension-registry changes

Be sure to only change the `context` object if its content changes; otherwise, you could create unnecessary re-renders. The following example shows how to approach these scenarios in a safe way:

```tsx
import { useMemo } from 'react';
import { usePluginLinkExtensions } from '@grafana/runtime';

function AppMenuExtensionPoint({ referenceId }) {
  // Instead of defining the object here (which would result in a new object on every render),
  // we use `useMemo()` to only update the context object when its "dynamic" dependencies change.
  const context = useMemo(
    () => ({
      referenceId,
      timeZone: 'UTC',
    }),
    [referenceId]
  );
  const { extensions } = usePluginLinkExtensions({
    extensionPointId: 'plugins/another-app-plugin/menu',
    context,
  });

  if (extensions.length === 0) {
    return null;
  }

  return (
    <div>
      {extensions.map((extension) => {
        return (
          <a href={extension.path} onClick={extension.onClick} title={extension.description} key={extension.key}>
            {extension.title}
          </a>
        );
      })}
    </div>
  );
}
```

#### Example - rendering component extensions

Component type extensions are simple React components, which gives you much more freedom in what you can make them do. You can pass contextual information to the extension components using props.

```tsx title="src/components/Toolbar.tsx"
import { usePluginComponentExtensions } from '@grafana/runtime';

export const Toolbar = () => {
  // This only returns type="component" extensions
  // Heads up! We don't specify a context object below, we pass in the contextual information as a prop to the component later.
  const { extensions } = usePluginComponentExtensions({ extensionPointId: '<extension-point-id>' });

  return (
    <div>
      <div className="title">Title</div>
      <div className="extensions">
        {/* Loop through the available extensions */}
        {extensions.map((extension) => {
          const Component = extension.component as React.ComponentType<{
            version: string;
          }>;

          // Render extension component and pass contextual information (version)
          return (
            <div key={extension.id}>
              <Component version="1.0.0" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

### The `getPluginExtensions()` method - _deprecated_

The `getPluginExtensions` method takes an object consisting of the `extensionPointId`, which must begin `plugins/<PLUGIN_ID>`, and any contextual information that you want to provide. The `getPluginLinkExtensions` method returns a list of extension links that your program can then loop over.

:::note

This function only returns the state of the extensions registry (the extensions registered by plugins) at a given time. If there are extensions registered by plugins after that point in time, you won't receive them. <br />
As a best practice, use the reactive [`usePluginExtensions()`](#usepluginextensions) hook instead wherever possible.

:::

#### Syntax

```tsx
getPluginExtensions(options);
getPluginLinkExtensions(options); // Only returns extensions that have type `type="link"`
getPluginComponentExtensions(options); // Only returns extensions that have type `type="component"`
```

#### Parameters

##### `options.extensionPointId` - _string_

The unique identifier of your extension point. It must begin with `plugins/<PLUGIN_ID>`. For example: `plugins/myorg-super-app`.

##### `options?.context` - _object (Optional)_

As an arbitrary object, it contains information related to your extension point which you would like to share with the extensions. For example: `{ baseUrl: '/foo/bar' }`.

This parameter is not available for component extensions; for those, you can pass contextual information using the component props.

:::note

The provided context object always gets frozen (turned immutable) before being shared with the extensions.

:::

##### `options?.limitPerPlugin` - _number (Optional)_

Use this method to specify the maximum amount of extensions that should be returned from the same plugin. It can be useful in cases when there is limited space on the UI to display extensions.

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
            version: string;
          }>;

          // Render extension component and pass contextual information (version)
          return (
            <div key={extension.id}>
              <Component version="1.0.0" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
```
