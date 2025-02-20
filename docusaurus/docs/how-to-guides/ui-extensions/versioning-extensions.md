---
id: versioning-extensions
title: Version extensions
description: This document covers best practices for versioning UI extensions, ensuring stability, compatibility, and smooth transitions.
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
sidebar_position: 40
---

# Best practices for versioning UI extensions

To maintain stability and ensure smooth transitions when updating UI extensions, include a _version suffix_ in the ID of the extension point or exposed component. This practice preserves compatibility while allowing developers to manage breaking changes in a controlled way.

## Use a version suffix in the ID

Each extension point ID/component ID should include a suffix indicating the major version of the extension.

**Example:**

```typescript
// Initial version
export const EXTENSION_POINT_OR_COMPONENT_ID_V1 = 'my-plugin-id/feature/v1';

// Breaking change introduced
export const EXTENSION_POINT_OR_COMPONENT_ID_V2 = 'my-plugin-id/feature/v2';
```

- Non-breaking changes (for example, adding optional properties) _do not_ require a new version suffix.
- Breaking changes (for example, modifying behaviors or removing properties) _must_ introduce a new version suffix.

## Support multiple versions during transition

When introducing a new major version, the application should serve both the old and new versions for a transition period. This allows consumers time to migrate without immediate disruptions.

**Example:**

- `my-plugin-id/feature/v1` continues to function while `my-plugin-id/feature/v2` is introduced.
- Consumers gradually migrate to `v2`.
- After a deprecation period for `v1`, you can safely remove it.

## Clearly communicate deprecations

Deprecation should be clearly communicated to consumers to ensure a smooth transition.

- Use the `@deprecated` keyword in published types and reference the changelog or migration guide.

  **Example:**

  ```typescript
  /**
   * @deprecated Use FeatureConfigV2 instead. See migration guide: https://example.com/migration-guide
   */
  export type FeatureContextV1 = {
    /* ... */
  };
  ```

- Document changes in a changelog or migration guide.
- Provide a timeline for deprecating older versions.
- Notify consumers of upcoming changes to prevent unexpected breakages.

## Publish types with version suffixes

:::note
This option is currently only availabe for plugins developed within the grafana organization.
:::

To support consuming multiple versions simultaneously, publish types to `@grafana/plugin-types` using the same version suffix. This allows developers to import types from different versions without conflicts.

**Example:**

```typescript
// Extension point context
import { FeatureContextV1 } from '@grafana/plugin-types/my-plugin-id';
import { FeatureContextV2 } from '@grafana/plugin-types/my-plugin-id';

// Exposed component props
import { ComponentPropsV1 } from '@grafana/plugin-types/my-plugin-id';
import { ComponentPropsV2 } from '@grafana/plugin-types/my-plugin-id';
```

- Ensures type safety when working with different extension versions.
- Avoids breaking existing consumers when introducing changes.

## Summary

By following this approach to version extensions and extension points, you can ensure they remain stable while allowing for iterative improvements, smooth migrations, and safer type management.
