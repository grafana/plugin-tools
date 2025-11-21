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

Control the visibility of included pages in app plugin using feature flags.

:::note

This feature is only available in Grafana 12.4 and later.

:::

## How it works

Grafana checks for feature flags when users access plugin pages. The flag key format is:

```ini
[feature_toggles]
plugin-page-visible.<path> = false
```

Pages are visible by default. Set the flag to `false` to hide the page from the navigation. When users try to access a hidden page, Grafana returns a `403 Forbidden` response.

This means that to add a experimental page, you first need to deploy the feature flag with the value set to `false` and then release or deploy the plugin with the new page.

## Example

To hide `/a/myorg-basic-app/my-page`:

1. Set the feature flag key: `plugin-page-visible./a/myorg-basic-app/my-page`
2. Set the value to `false`

```ini
[feature_toggles]
plugin-page-visible./a/myorg-basic-app/my-page = false
```

## Related resources

- Refer to the [Grafana feature toggles guide](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/feature-toggles/) for Grafana-specific configuration
