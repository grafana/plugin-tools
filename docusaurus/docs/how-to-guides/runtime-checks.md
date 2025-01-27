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

To take advantage of new Grafana features in plugins while maintaining compatibility with older versions, plugin authors need to implement conditional logic that checks for feature availability during runtime. Failing to account for backward compatibility can result in plugin crashes and a poor user experience.

The method for performing these runtime checks varies depending on the feature and how it is made available to plugin developers. The following examples demonstrate best practices for handling these scenarios effectively.

## Example: Conditionally invoke functions

Grafana 10.1.0 introduced the `createDataFrame` function in the `@grafana/data` package, deprecatiing the `MutableDataFrame` class. To maintain compatibility with Grafana versions prior to 10.1.0, plugins must implement conditional logic to determine whether these APIs are available at runtime.

```tsx
import { createDataFrame, DataFrameDTO, MutableDataFrame } from '@grafana/data';

function getDataFrame(data: DataFrameDTO) {
  if (typeof createDataFrame === 'undefined') {
    // fallback to the deprecated class for older versions
    return new MutableDataFrame(data);
  } else {
    // use the new API if available
    return createDataFrame(data);
  }
}
```

## Example: Conditionally using React hooks

In Grafana 11.1.0, the synchronous `getPluginLinkExtensions` function was deprecated and replaced by the reactive `usePluginLinks` hook. The following example demonstrates how to dynamically switch between the two APIs based on their availability.

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

## Example: Conditionally render a React component

The `UserIcon` was introduced in Grafana 10.1.0 and does not have a predecessor in earlier versions. To ensure compatibility, you can render the UserIcon component only when it is available in the current runtime environment.

```tsx
import React from 'react';
import { Card, UserIcon, UserView } from '@grafana/ui';

export const Profile = ({ userView }: { userView: UserView }) => {
  return (
    <Card>
      <Card.Heading>Profile</Card.Heading>
      <Card.Meta>{['Tag 1']}</Card.Meta>
      {/* Conditionally render the UserIcon component if it exists */}
      {UserIcon && <UserIcon userView={userView} />}
    </Card>
  );
};
```

## Example: Cover conditional rendering in an end-to-end test

When a feature is only available in certain Grafana versions, it’s a good practice to validate its conditional rendering through end-to-end (E2E) tests. These tests ensure that the plugin behaves correctly in both newer environments where the feature exists and older environments where it is unavailable.

In the following example, the test verifies that the `UserIcon` is rendered only if the Grafana version is 10.1.0 or later, while the rest of the user profile is always rendered.

```tsx
import * as semver from 'semver';
import { test, expect } from '@grafana/plugin-e2e';

test('should render profile', async ({ page, grafanaVersion }) => {
  const userProfile = page.getByTestId('user-profile');

  // verify the visibility of shared components
  await expect(userProfile.getByText('Heading')).toBeVisible();
  await expect(userProfile.getByText('Tag 1')).toBeVisible();

  // conditionally validate the rendering of the UserIcon component
  if (semver.gte(grafanaVersion, '10.1.0')) {
    await expect(userProfile.getByText('Jane Doe')).toBeVisible();
  }
});
```

### Further reading

- **end-to-end testing for plugins**: For comprehensive guidance on writing and running E2E tests for Grafana plugins, refer to the [documentation](../e2e-test-a-plugin/introduction.md).
- **Running end-to-end tests across multiple Grafana versions**: To learn how to configure your workflows to test plugins against different Grafana versions, see the [example workflows](../e2e-test-a-plugin/ci.md).
