---
id: include-page-behind-feature-toggle
title: Include a page behind a feature toggle
description: How to include a page behind a feature toggle
keywords:
  - grafana
  - plugins
  - plugin
  - app
  - navigation
---

# Include a page behind a feature toggle

You can use feature flags to control the visibility of pages in app plugins. While pages are visible by default, you can flag them to hide them from navigation.

:::note

This feature is only available in Grafana 12.4 and later.

:::

## How it works

Grafana checks for feature flags when users access plugin pages. Pages are visible by default.

The flag key format is:

```ini
[feature_toggles]
plugin-page-visible.<path> = false
```

If you set the visibility flag to `false`, the page will be hidden from the navigation. When a user tries to access it, Grafana returns a `403 Forbidden` response.

To add a experimental page:

1. Deploy the feature flag with the value set to false.
1. Release or deploy the plugin with the new page.

## Example

To hide `/a/myorg-basic-app/my-page`:

1. Set the feature flag key to `plugin-page-visible./a/myorg-basic-app/my-page`.
2. Set the value to `false`.

```ini
[feature_toggles]
plugin-page-visible./a/myorg-basic-app/my-page = false
```

## Related resources

Refer to the [Grafana feature toggles guide](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/feature-toggles/) for Grafana-specific configuration
