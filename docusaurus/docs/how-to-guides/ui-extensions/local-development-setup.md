---
title: Testing UI extensions between multiple plugins
description: Learn how to set up your local environment for UI extension development.
---

# Testing UI extensions between multiple plugins

When developing a plugin that interacts with UI extensions from another plugin, you need a way to have both plugins running in your local Grafana instance. This guide walks you through setting up a local development environment for testing UI extensions between multiple plugins.

The process involves two main steps:

1.  Installing the target plugin you want to test against.
2.  Configuring the target plugin using Grafana's provisioning system.

## Step 1: Install the target plugin

To test the interaction between your plugin and another, you first need to install the target plugin in your local development environment. You have two options to do this.

### Option 1: Install from a URL (Recommended)

The recommended approach is to use the `GF_INSTALL_PLUGINS` environment variable in your `docker-compose.yml` file. This allows you to install a pre-built version of the plugin from a URL. This method is flexible and makes it easy to switch between different versions of the plugin by simply changing the URL.

Here's an example of how to use `GF_INSTALL_PLUGINS` in your `docker-compose.yml`:

```yaml
environment:
  - GF_INSTALL_PLUGINS=https://example.com/path/to/your-plugin.zip;your-plugin-id
```

### Option 2: Clone, build, and link the plugin

Alternatively, you can clone the source code of the target plugin and link it to your local Grafana instance. However, this approach is more complex because it requires you to install all the dependencies and build the plugin before you can run it. Therefore, this approach is generally not recommended.

## Step 2: Configure the target plugin with provisioning

Once the plugin is installed, you need to configure it. The best way to do this is by using Grafana's provisioning system, which automates the configuration process when your local Grafana instance starts.

:::note

If you scaffolded your plugin with the [create-plugin tool](../../../plugin-tools), the provisioning setup is already included in your project.

:::

To configure the plugin, follow these steps:

1.  **Create provisioning files**: In your plugin's root directory, you should have a `provisioning` folder. Inside this folder, you can add YAML files to configure data sources, dashboards, and other resources required by the plugin you are testing against. For an example of provisioning files, see the [grafana-plugin-examples repository](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/app-basic/provisioning/plugins). For more information about provisioning, see the [Grafana provisioning documentation](https://grafana.com/docs/grafana/latest/administration/provisioning/).

2.  **Mount the provisioning folder**: Ensure that your `docker-compose.yml` file mounts the `provisioning` folder as a volume to `/etc/grafana/provisioning`:

    ```yaml
    volumes:
      - ./provisioning:/etc/grafana/provisioning
    ```

### Handling backend dependencies

If the plugin you are testing against has a backend component, it might require additional setup. In this case, we recommend reaching out to the plugin's authors. They may be able to provide a testing environment or test data that you can use in your provisioning files.

By following these steps, you can create a robust local development environment for developing and testing UI extensions that interact with other plugins.

## Testing your UI extensions

Once you have your local development environment set up, consider writing end-to-end (e2e) tests to verify that your UI extensions work correctly. E2e tests help ensure that your extensions integrate properly with other plugins and provide a reliable way to catch regressions. For more information about e2e testing, see the [e2e testing documentation](../../e2e-test-a-plugin/).
