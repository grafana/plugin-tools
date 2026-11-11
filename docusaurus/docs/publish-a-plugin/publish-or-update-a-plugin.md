---
id: publish-a-plugin
title: Publish or update a plugin
sidebar_position: 4
description: How to package and share your Grafana plugin.
keywords:
  - grafana
  - plugins
  - plugin
  - publish plugin
  - update plugin
  - provision
---

# Publish or update a plugin

You've just built your plugin and now you want to share it with the world! 

Publishing your plugin to the [Grafana plugin catalog](https://grafana.com/plugins) makes it easily discoverable by millions of Grafana users. Read on to learn how to manage the lifecycle of a plugin in the catalog, from publishing and updating to potentially deprecating. The Grafana plugin catalog is free of charge.

:::note

You can also **distribute your plugins through the Grafana Marketplace** and earn revenue from the extensions you build for Grafana. The Grafana Marketplace is a paid label inside the Grafana plugin catalog open to all contributors. For more details refer to [Monetize your plugin](#monetize-your-plugin).

:::


## Before you begin

- [Review our guidelines](https://grafana.com/legal/plugins/#plugin-publishing-and-signing-criteria) - Learn about the Grafana Labs criteria for publishing and signing plugins.
- [Review our publishing best practices](../publish-a-plugin/publishing-best-practices.md) - Ensure your plugin is in the best state it can be before submitting it for review.
- [Package a plugin](./package-a-plugin.md) - Build the plugin and get it ready to share in the form of a ZIP archive.
- Refer to [plugin-examples](https://github.com/grafana/grafana-plugin-examples) to review best practices for building your plugin.

**To speed up the time it takes to review your plugin:**

- Check that your plugin is ready for review using the [plugin validator](https://github.com/grafana/plugin-validator).
- Provide sample dashboards and test data with your repository so that the plugin's functionality can be verified. Use the [provisioning](./provide-test-environment.md) process provided to simplify this step.

## Publish your plugin

Follow these steps to publish your plugin for the first time.

1. [Sign in](https://grafana.com/auth/sign-in) to your Grafana Cloud account. Note that you need to be an administrator for the Grafana Cloud organization being used to publish the plugin.
1. In the left menu, under Org Settings, click **My Plugins**.
1. Click **Submit New Plugin**. The Create Plugin Submission dialog box appears.

   ![Submit plugin.](/img/plugins-submission-create.png)

1. Enter the information requested by the form.
   - **How do you want to list your plugin?**
     - Select **Public (free)** to list your plugin in the Grafana plugin catalog free of charge.
     - Select **Marketplace (paid)** to list a commercial plugin in the Grafana Marketplace. Marketplace submissions follow a separate review process. Refer to [Monetize your plugin](#monetize-your-plugin).
   - **Plugin (zip file):** Select **Paste a URL** and enter a URL that points to a ZIP archive of your packaged plugin, or select **Upload file** to upload the ZIP archive directly.
   - **MD5 or SHA1:** The MD5 or SHA1 checksum of the plugin ZIP archive, or a URL that points to a file containing the checksum, for example `https://example.com/plugin.zip.sha1`.
   - **Source code:** Select **Paste a URL** and enter a URL that points to a public Git repository or ZIP archive of your complete plugin source code, or select **Upload file** to upload a ZIP archive of up to 200 MB. Grafana Labs uses the source code to verify your plugin. If you use a Git repository, include the branch or tag that corresponds to this submission in the URL.
   - **Testing guidance:** An overview covering the installation, configuration, and usage of your plugin. Include any links to credentials needed to test it.
   - **Provisioning provided for test environment:** Select **Yes** if you have [configured provisioning](./provide-test-environment.md). If you've done this, rest assured it will be identified during the review, and no additional action is needed on your part.
   - **Are you affiliated with the project/product the plugin integrates with?** Select **Yes** or **No**.
   - **Does the plugin integrate with a commercial product?** Select **Yes** or **No**.

     Your answers to the last two questions help us determine the [signature level](https://grafana.com/legal/plugins/#what-are-the-different-classifications-of-plugins) for your plugin.
1. Click **Submit**.

### Plugin submission review

After you submit your plugin:

1. The Grafana Plugins team runs an automated validation to make sure it adheres to the Grafana guidelines.
1. Upon the validation, your submission is placed in a review queue.
1. A plugin reviewer performs a manual inspection that consists of: 
  - **Code review**: For quality and security purposes, we review the source code for the plugin.
  - **Tests**: We install your plugin on one of our Grafana instances to test it for basic use. 
    * We may ask you to assist us in configuring a test environment for your plugin.
    * We'll use this test environment whenever you submit a plugin update.

:::note

Following [best practices](./publishing-best-practices.md) or [providing a test environment](./provide-test-environment.md) does not guarantee the approval of a submitted plugin. The Grafana Plugins team studies each submission individually and decides on a case-by-case basis. 

:::

## Update your plugin

To update a plugin, follow the same guidance as for [publish your plugin](#publish-your-plugin), except in Step 3 where you can now click **Submit Update** for the plugin you want to update.

All plugin submissions, new or updates, go through the same automated and rigorous manual review process. Because we may have a test environment already setup for an existing plugin, plugin update reviews may go faster.

## Monetize your plugin

The Grafana Marketplace provides an optional path for plugin developers, independent software vendors, and partners to sell and distribute commercial plugins through the Grafana plugin catalog, subject to the approval and discretion of Grafana Labs. 

Marketplace plugins are published in the Grafana Catalog with a `Marketplace` label, and can be proprietary. Paid Marketplace plugins can help you fund ongoing development, maintenance, updates, and support.

For more background, refer to the [Grafana Labs Opens the Grafana Marketplace](https://grafana.com/press/2026/10/20/marketplace-ga/) press release. 

:::caution

Marketplace submissions follow a separate review process from free plugins. If you have any questions or wish to submit a monetizable plugin, contact the Grafana Marketplace team at [plugins-marketplace@grafana.com](mailto:plugins-marketplace@grafana.com). 

:::

## Deprecate a plugin

If a plugin is no longer relevant or is unable to be maintained, plugin developers can request that the plugin be deprecated and removed from the catalog. Similarly, Grafana Labs may deprecate and delist a plugin as part of curating the catalog and ensuring plugins meet our standards for security, quality and compatibility.

For more information on plugin deprecation and how to request your plugin to be deprecated, refer to the Grafana Labs [Plugin Deprecation Policy](https://grafana.com/legal/plugin-deprecation/).

