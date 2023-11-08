---
id: provide-provisioning
title: Provide provisioning to your plugin
description: How to add provisioning to your plugin.
keywords:
  - grafana
  - plugins
  - plugin
  - github
sidebar_position: 5
---

Provisioning allows users to pre-configure data sources, dashboards, making it easier to manage Grafana Plugins.

## Implementation Steps

### Provisioning Configuration
1. Create a configuration file in JSON or YAML format to define provisioning settings.
2. Define data source configurations, dashboard templates etc in the configuration file.
3. Ensure your plugin can read and apply this configuration.

### Data Sources
1. Allow users to provision data sources in the configuration.
2. Ensure your plugin supports various data source types and configurations.
3. Integrate data source provisioning into your plugin's settings or configuration page.

### Dashboards
1. Define dashboard templates that users can provision.
2. Provide placeholders in the templates for dynamic variables.
3. Enable users to select and apply these templates when creating dashboards.

## Testing
Thoroughly test your plugin with provisioning features enabled.
Verify that data sources, dashboards are provisioned correctly.
Test scenarios involving a large number of provisioned resources.

## Documentation
Create clear and user-friendly documentation explaining how to use provisioning in your plugin.
Provide examples, use cases, and configuration file structure.
Include screenshots or illustrations to assist users in the provisioning process.

