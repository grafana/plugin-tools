---
id: customize-navigation-position
title: Customize navigation placement of plugin pages
description: How to relocate Grafana app plugin pages to customize the navigation menu structure.
keywords:
  - grafana
  - plugins
  - plugin
  - navigation
  - customize
  - configuration
  - grafana.ini
---

# Customize Navigation Placement of App Plugin Pages

# Introduction

By default, Grafana app plugins and their pages appear under the "More apps" section in the navigation menu. However, as a Grafana administrator, you might want to improve user experience by relocating specific pages or entire app plugins to more relevant sections of the navigation hierarchy. This guide shows you how to customize the placement of app plugin pages across different parts of your Grafana navigation menu.

:::important
The navigation customization described in this guide must be performed by the Grafana administrator in the Grafana instance configuration. Plugin developers cannot directly control the navigation placement in a Grafana instance.
:::

## Customize App and Page Navigation Placement

You can change the location of your app plugin pages in two ways:

1. Move the entire app plugin (with all its pages) to a different section
2. Move specific pages from your app plugin to different sections

### 1. Move an Entire App Plugin to a Different Section

To relocate an entire app plugin to a different navigation section, use the `navigation.app_sections` configuration in your grafana configuration file:

```ini
[navigation.app_sections]
org-example-app = explore 100
```

This configuration:

- Moves the app plugin with ID `org-example-app`
- Places it in the `explore` section
- Assigns it a sort weight of `100` (determining its position within that section)

### 2. Move Individual App Pages to Different Sections

To move specific pages from an app plugin to different navigation sections, use the `navigation.app_standalone_pages` configuration:

```ini
[navigation.app_standalone_pages]
/a/org-example-app/dashboard-page = dashboards 200
/a/org-example-app/monitoring-page = alerting 50
```

This configuration:

- Moves the page with path `/a/org-example-app/dashboard-page` to the `dashboards` section with sort weight `200`
- Moves the page with path `/a/org-example-app/monitoring-page` to the `alerting` section with sort weight `50`

## Complete Example

Here's a complete example that configures both the app placement and individual page placement in your Grafana configuration:

```ini
# Move the entire app to the Explore section
[navigation.app_sections]
org-example-app = explore 50

# Move specific pages to their own sections
[navigation.app_standalone_pages]
/a/org-example-app/metrics = dashboards 100
/a/org-example-app/logs = alerting 75
```

## Understanding Page Paths

To move individual pages, you need to know their paths. Page paths in app plugins follow this format:
`/a/PLUGIN_ID/PAGE_PATH`

For more information on how plugin developers define these pages, see the [Add a page in the navigation menu](../../tutorials/build-a-panel-plugin.md##add-a-page-in-the-navigation-menu) section in the Grafana documentation.

## Troubleshooting

If your navigation changes don't appear:

1. Verify your configuration syntax is correct
2. Ensure you've restarted Grafana after making changes
3. Check that the plugin IDs and page paths exactly match what's defined in your plugin
