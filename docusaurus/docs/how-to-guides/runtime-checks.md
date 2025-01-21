---
id: runtime-checks
title: Manage backwards compatibility with runtime checks
description: How to manage backwards compatibility with runtime checks.
keywords:
  - grafana
  - plugins
  - plugin
  - compatibility
---

# Manage backwards compatibility with runtime checks

To leverage new Grafana features in plugins while ensuring backward compatibility with older versions, plugin authors must implement conditional logic to adapt to feature availability at runtime. Neglecting backward compatibility can lead to plugin crashes and a degraded user experience.

The approach for performing these runtime checks depends on the specific feature and how it is exposed to plugin developers. Below are examples illustrating how to handle such scenarios effectively.

## Example: Conditionally invoking functions

Starting with Grafana 10.1.0, the `@grafana/data` package introduced the `createDataFrame` function, marking the deprecation of the `MutableDataFrame` class. To maintain compatibility with versions prior to 10.1.0, plugins must implement conditional logic to determine whether these APIs are available at runtime.

```tsx
import { createDataFrame, DataFrameDTO, MutableDataFrame } from '@grafana/data';

function getDataFrame(data: DataFrameDTO) {
  if (typeof createDataFrame !== 'undefined') {
    // use the new API if available
    return createDataFrame(data);
  } else {
    // fallback to the deprecated class for older versions
    return new MutableDataFrame(data);
  }
}
```

## Example: Conditionally using React hooks

In Grafana 11.1.0, the syncronous `getPluginLinkExtensions` function got depcrecated in favour of the new reactive `usePluginLinks` hook. The following example shows how to dynamically alternate between the two APIs based on their availability.

```tsx
import { useMemo } from 'react';
import { PluginExtensionLink } from '@grafana/data';
import {
  GetPluginExtensionsOptions,
  getPluginLinkExtensions,
  usePluginLinks as usePluginLinksOriginal,
} from '@grafana/runtime';

function useLegacyLinkExtensions({ context, extensionPointId }: GetPluginExtensionsOptions): {
  links: PluginExtensionLink[];
  isLoading: boolean;
} {
  const { extensions } = useMemo(
    () =>
      getPluginLinkExtensions({
        extensionPointId,
        context,
      }),
    [context, extensionPointId]
  );

  return {
    links: extensions,
    isLoading: false,
  };
}

// dynamically decide which API to use
const usePluginLinks = usePluginLinksOriginal !== undefined ? usePluginLinksOriginal : useLegacyLinkExtensions;

export function ToolbarExtensionPoint() {
  const { links, isLoading } = usePluginLinks({ extensionPointId: 'myorg-foo-app/toolbar/v1' });

   // Your implementation here
  ...
}
```
