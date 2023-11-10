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
---

# Publish or update a plugin

You've just built your plugin; now you want to share it with the world. Publishing your plugin to the [Grafana plugin catalog](https://grafana.com/plugins) makes it easily discoverable by millions of Grafana users.

In this guide you learn how to manage the lifecycle of a plugin in the catalog, from publishing and updating to potentially deprecating.

## Before you begin

- [Review our guidelines](https://grafana.com/legal/plugins/#plugin-publishing-and-signing-criteria) - Learn about the Grafana Labs criteria for publishing and signing plugins.
- [Package a plugin](./package-a-plugin.md) - Build the plugin and get it ready to share in the form of a ZIP archive.
- Refer to [plugin-examples](https://github.com/grafana/grafana-plugin-examples) to review best practices for building your plugin.

To speed up the time it takes to review your plugin:

- Check that your plugin is ready for review using the [plugin validator](https://github.com/grafana/plugin-validator).
- Provide sample dashboards and test data with your repository so that the plugin's functionality can be verified.

## Publish your plugin

Follow these steps to publish your plugin for the first time.

1. [Sign in](https://grafana.com/auth/sign-in) to your Grafana Cloud account.
1. In the left menu, under Org Settings, click **My Plugins**.
1. Click **Submit New Plugin**. The Create Plugin Submission dialog box appears.

   ![Submit plugin.](/img/plugins-submission-create2.png)

1. Enter the information requested by the form.
   - **OS & Architecture:**
     - Select **Single** if your plugin archive contains binaries for multiple architectures.
     - Select **Multiple** if you'd like to submit separate plugin archives for each architecture.
       This can lead to faster downloads since users can select the specific architecture on which they want to install the plugin.
   - **URL:** A URL that points to a ZIP archive of your packaged plugin.
   - **Source code URL:** A URL that points to a public Git repository or ZIP archive of your complete plugin source code.
   - **SHA1:** The SHA1 hash of the plugin specified by the **URL**.
   - The remaining questions help us determine the [signature level](./sign-a-plugin#plugin-signature-levels) for your plugin.
1. Click **Submit**.
   After you submit your plugin, we run an automated validation to make sure it adheres to our guidelines.
   Once your submission passes the validation, it's placed in a review queue.
   All submissions are manually inspected by a plugin reviewer.
   For every new plugin, we perform a manual review that includes the following checks:

   - **Code review:** For quality and security purposes, we review the source code for the plugin.
   - **Tests:** We install your plugin on one of our Grafana instances to test it for basic use.
     We may ask you to assist us in configuring a test environment for the plugin.
     We use the test environment whenever you submit a plugin update.

## Update your plugin

To update a plugin, follow the same guidance as for [publishing a plugin](#publishing-a-plugin), except in Step 3 where you can now click **Submit Update** for the plugin you want to update.

All plugin submissions, new or updates, go through the same automated and rigorous manual review process. Because we may have a test environment already setup for an existing plugin, plugin update reviews may go faster.

## Deprecate a plugin

If a plugin is no longer relevant or is unable to be maintained, plugin developers can request that the plugin be deprecated and removed from the catalog. Similarly, Grafana Labs may deprecate and delist a plugin as part of curating the catalog and ensuring plugins meet our standards for security, quality and compatibility.

For more information on plugin deprecation and how to request your plugin to be deprecated, refer to the Grafana Labs [Plugin Deprecation Policy](https://grafana.com/legal/plugin-deprecation/).

## Frequently asked questions

### Do I need to submit a private plugin?

- No. Please only submit plugins that you wish to make publicly available for the Grafana community.

### How long does it take to review a submission?

- We're not able to give an estimate at this time, though we're constantly working on improving the time it takes to review a plugin.

### Can I decide a date when my plugin will be published?

- No. We cannot guarantee specific publishing dates, as plugins are immediately published after a review based on our internal prioritization.

### Can I see metrics of my plugin installs, downloads or usage?

- No. We don't offer this information at the moment to plugin authors.

### How can I update my plugin's catalog page?

- The plugin's catalog page content is extracted from the plugin README file.
  To update the plugin's catalog page, submit an updated plugin with the new content included in the README file.

### Can I unlist a plugin?

- In the event of a bug, unlisting the plugin from our catalog may be possible in exceptional cases, such as security concerns. However, we don't have control over the instances where the plugin is installed.

- Also, refer to the Grafana Labs [Plugin Deprecation Policy](https://grafana.com/legal/plugin-deprecation/) to learn more about plugin deprecation.

### Can I distribute my plugin somewhere else other than the Grafana plugin catalog?

- The official method for distributing Grafana plugins is through our catalog. Alternative methods, such as installing private or development plugins on local Grafana instances, are available as per the guidelines provided in [this guide](https://grafana.com/docs/grafana/latest/administration/plugin-management#install-plugin-on-local-grafana).

### Can I still use Angular for a plugin?

- No. We will not accept any new plugin submissions written in Angular. For more information, refer to our [Angular support deprecation documentation](https://grafana.com/docs/grafana/latest/developers/angular_deprecation/).

### Can I submit plugins built with Toolkit?

- The @grafana/toolkit tool is deprecated. Please [migrate to `create-plugin`](../migration-guides/migrate-from-toolkit.mdx). In the future, we will reject submissions based on @grafana/toolkit as it becomes increasingly out-of-date.

### Do plugin signatures expire?

- Plugin signatures do not currently expire.

### What source code URL formats are supported?

- Using a tag or branch: `https://github.com/grafana/clock-panel/tree/v2.1.3`
- Using a tag or branch and the code is in a subdirectory (important for mono repos): `https://github.com/grafana/clock-panel/tree/v2.1.3/plugin/` (here, the plugin contains the plugin code)
- Using the latest main or master branch commit: `https://github.com/grafana/clock-panel/` (not recommended, it's better to pass a tag or branch)
