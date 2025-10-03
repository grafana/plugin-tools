---
title: Local development setup for UI extensions
description: Learn how to set up your local environment for UI extension development.
---

# Local development setup

This guide explains how to set up your local development environment for testing UI extensions between multiple plugins.

When developing a plugin that interacts with UI extensions from another plugin, you need a way to have both plugins running in your local Grafana instance. This guide outlines the recommended approach using provisioning and Docker Compose.

## Using provisioning to configure the target plugin

The recommended way to set up the plugin you want to test against is by using Grafana's provisioning system. This allows you to configure the plugin automatically when your local Grafana instance starts.

1.  **Create provisioning files**: In your plugin's root directory, create a `provisioning` folder. Inside this folder, you can add YAML files to configure data sources, dashboards, and other resources required by the plugin you want to test against.

2.  **Mount the provisioning folder**: In your `docker-compose.yml` file, mount the `provisioning` folder as a volume to `/etc/grafana/provisioning`:

    ```yaml
    volumes:
      - ./provisioning:/etc/grafana/provisioning
    ```

### Handling backend dependencies

If the plugin you are testing against has a backend component, you might need additional setup. We recommend reaching out to the authors of that plugin to see if they can provide a testing environment or test data that you can use in your provisioning files.

## Installing the target plugin

You have two main options for installing the plugin you want to test against in your local development environment.

### Option 1: Cloning and linking the plugin (not recommended)

You can clone the source code of the target plugin, build it, and then link it to your local Grafana instance. However, this approach can be complex and is not recommended.

### Option 2: Installing from a URL (recommended)

A simpler and more flexible approach is to use the `GF_INSTALL_PLUGIN` environment variable in your `docker-compose.yml` file. This allows you to install a pre-built version of the plugin from a URL. This method makes it easy to switch between different versions of the plugin by simply changing the URL.

Here's an example of how to use `GF_INSTALL_PLUGIN` in your `docker-compose.yml`:

```yaml
environment:
  - GF_INSTALL_PLUGIN=https://example.com/path/to/your-plugin.zip
```

By following these steps, you can create a robust local development environment for testing UI extensions that interact with other plugins.
