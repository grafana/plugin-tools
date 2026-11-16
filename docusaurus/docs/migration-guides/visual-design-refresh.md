---
id: visual-design-refresh
title: Update your plugin for the visual design refresh
description: How to check and update a Grafana plugin so it matches the refreshed Grafana UI, including backgrounds, border radius, primary and accent colors, sizes, and typography.
keywords:
  - grafana
  - plugins
  - plugin
  - migration
  - theme
  - visual refresh
  - design tokens
---

# Update your plugin for the visual design refresh

Grafana's visual design refresh updates the look of the Grafana UI. It brings deeper grays, white primary actions, more restrained use of Grafana orange, a rounder UI, subtle borders on cards, panels, and floating elements, a single page background, and adjusted sizes for buttons, form fields, and typography variants. Workflows, navigation, and component APIs don't change. For an overview of the refresh, refer to [What's new: Grafana visual UI refresh](https://grafana.com/whats-new/2026-10-26-grafana-visual-ui-refresh/).

Plugins that use `@grafana/ui` components and theme tokens pick up most of the new look automatically. Plugins that hardcode colors, sizes, or border radius, or that use tokens for purposes they weren't designed for, can look out of place next to the rest of Grafana. This guide explains how to find and fix those issues.

## Before you begin

To preview the refresh in your local development environment, enable the `grafana.visualDesignRefresh` feature toggle.

Then go through every screen of your plugin and compare it with the surrounding Grafana UI. Anything that doesn't match usually points to a hardcoded value. Replace hardcoded values with theme tokens, which you can access with the `useStyles2` hook:

```tsx
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    background: theme.colors.background.primary,
    borderRadius: theme.shape.radius.lg,
    padding: theme.spacing(2),
  }),
});

export function MyComponent() {
  const styles = useStyles2(getStyles);
  return <div className={styles.container}>...</div>;
}
```

## Choose a compatibility approach

Some of the tokens in this guide are only available in recent Grafana versions. Use the following approaches, in order of preference.

### Update your Grafana dependency

The simplest approach is to raise the `grafanaDependency` in your `src/plugin.json` file to the minimum version that includes the tokens you use. Each section in this guide lists the version you need.

```diff title="src/plugin.json"
 "dependencies": {
-  "grafanaDependency": ">=12.0.0",
+  "grafanaDependency": ">=13.1.0",
   "plugins": []
 }
```

### Check for the property before you use it

If the latest version of your plugin must keep supporting older Grafana versions, check that a token exists before you use it and fall back to an older token:

```ts
const accent = Object.keys(theme.colors).includes('accent') ? theme.colors.accent.main : theme.colors.primary.main;
```

### Check the theme flag

If it's not possible to check for the existence of a property, you can check `theme.flags.visualDesignRefresh`:

```ts
const theme = useTheme2();
const headerBackground = theme.flags.visualDesignRefresh
  ? theme.colors.background.page
  : theme.colors.background.primary;
```

:::caution

Use the theme flag only as a last resort. It will be removed in a future release, and you'll need to remove any code that depends on it at that point.

:::

## Match backgrounds

The refresh uses a single page style with a new `theme.colors.background.page` token. Components that set their own background to match the page, such as sticky headers, toolbars, or scroll shadows, might no longer match.

Use `theme.colors.background.page` for any element that needs to blend into the page background. This token is available in Grafana 13.1.0 or later.

## Use the correct border radius

The refreshed UI is rounder, so components with square corners stand out. Use the `theme.shape.radius` tokens instead of hardcoded values or no radius:

- `theme.shape.radius.sm`: Small or inner widgets, such as checkboxes and badges.
- `theme.shape.radius.md`: Most standard form widgets, such as inputs and selects.
- `theme.shape.radius.lg`: Containers, such as cards, panels, menus, and modals.

These tokens are available in Grafana 12.3.0 or later.

## Use primary and accent colors correctly

In the refreshed theme, the primary color is white in dark mode, so it stands out much more than before. Reserve `theme.colors.primary` for the main action on a page, and use it for only one element on any given page.

Some uses of the primary color now belong to a new `theme.colors.accent` token, which is orange in the refreshed theme. Use the accent color for elements such as:

- Checked states of checkboxes, radio buttons, and switches
- Focus styles
- Selected or active indicators

The accent token is available in Grafana 13.1.0 or later. If you need to support older versions, [check for the property](#check-for-the-property-before-you-use-it):

```ts
const accent = Object.keys(theme.colors).includes('accent') ? theme.colors.accent.main : theme.colors.primary.main;
```

## Check sizes and typography

The refresh adjusts the sizes of buttons and form fields, and changes the sizes and weights of the typography variants. If your plugin hardcodes heights, font sizes, or line heights to match the old UI, it can end up misaligned with Grafana components.

To keep your plugin consistent:

- Use `@grafana/ui` components, such as `Button`, `Input`, and `Combobox`, instead of custom controls.
- Use `theme.typography` variants, such as `theme.typography.body` and `theme.typography.h4`, or the `Text` component, instead of hardcoded font sizes.
- Use `theme.spacing()` for gaps and padding, and avoid fixed heights where possible.

After you update your styles, check for clipped text, misaligned inline elements, and toolbars or rows that now overflow.

## Next steps

- For an overview of the refresh, refer to [What's new: Grafana visual UI refresh](https://grafana.com/whats-new/2026-10-26-grafana-visual-ui-refresh/).
- For general styling guidance, refer to [Best practices](../key-concepts/best-practices.md).
- For the full list of theme tokens, refer to the [Grafana themes guide](https://github.com/grafana/grafana/blob/main/contribute/style-guides/themes.md).
