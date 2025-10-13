---
id: extension-user-use-function
title: Use extension points for general functions
sidebar_label: Use extension points for general functions
sidebar_position: 10
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
  - function extension
---

An extension point is a part of your plugin or Grafana UI where you can render content (links, functions or React components) from other plugins. Use them to extend your users' experience based on a context exposed by the extension point.

:::note
Read more about extensions under [key concepts](../../how-to-guides/ui-extensions/ui-extensions-concepts.md). <br />
For reference documentation, including the APIs, see [UI extensions reference guide](../../reference/ui-extensions-reference).
:::

## Best practices for function extensions

- **Share contextual information** <br /> Think about what contextual information could be useful for other plugins and pass this as parameters to the function.
- **Handle errors** <br /> Make sure to handle any errors that could be thrown by the function extensions.

## Create an extension point for functions

```tsx
import { usePluginFunctions } from '@grafana/runtime';

export const MyComponent = () => {
  // This is unique ID for your extension point.
  // This is also what other plugins (content providers) use when they call `AppPlugin.addFunction({...})`
  // - postfix the ID with a version number (in this example "/v1")
  // - prefix the ID with your plugin id (in this example "myorg-foo-app/"),
  //   or with "grafana/" for core Grafana extension points
  const extensionPointId = 'myorg-foo-app/myfunction/v1';
  const { functions, isLoading } = usePluginFunctions({ extensionPointId });
  const onClick = useCallback(() => {
    functions.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        // Handle errors here
      }
    });
  }, [functions]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <Button onClick={onClick}>Click</Button>;
};
```

## Passing data to the functions

We are building on top of the previous example, but this time we are also passing some contextual data to the functions:

```tsx
import { usePluginFunctions } from '@grafana/runtime';

// Exposing the type for better developer experience
// (Check the next section for how to share this type with other plugins)
export type Fn = (params: { activeProjectId: string }) => void;

export const MyComponent = () => {
  const extensionPointId = 'myorg-foo-app/myfunction/v1';
  const { projectId } = useActiveProject();
  // Using the `Fn` type as a generic
  const { functions, isLoading } = usePluginFunctions<Fn>({ extensionPointId });
  const onClick = useCallback(() => {
    functions.forEach((fn) => {
      try {
        fn({ activeProjectId: projectId });
      } catch (err) {
        // Handle errors here
      }
    });
  }, [functions, projectId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <Button onClick={onClick}>Click</Button>;
};
```

## Limit which plugins can register functions in your extension point

```tsx
import { usePluginFunctions } from '@grafana/runtime';

export type Fn = (params: { activeProjectId: string }) => void;

export const MyComponent = () => {
  const extensionPointId = 'myorg-foo-app/myfunction/v1';
  const allowedPluginIds = ['myorg-a-app', 'myorg-b-app'];
  const { projectId } = useActiveProject();
  const { functions, isLoading } = usePluginFunctions<Fn>({ extensionPointId });
  const onClick = useCallback(() => {
    functions
      .filter(({ pluginId }) => allowedPluginIds.includes(pluginId))
      .forEach((fn) => {
        try {
          fn({ activeProjectId: projectId });
        } catch (err) {
          // Handle errors here
        }
      });
  }, [functions, projectId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <Button onClick={onClick}>Click</Button>;
};
```
