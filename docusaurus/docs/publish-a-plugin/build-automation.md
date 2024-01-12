---
id: build-automation
title: Automate plugin builds
sidebar_position: 1
description: Automate Grafana plugin builds and releases
keywords:
  - grafana
  - plugins
  - plugin
  - automation
  - build
  - automate
  - builds
---

# Automate packaging and signing with CI

If your plugin has been set up to use the supplied [Git workflows](../create-a-plugin/develop-a-plugin/set-up-github-workflows.md) from [create-plugin](../get-started/get-started.mdx),
the plugin should be built and packaged in the correct format.

We recommend using the ZIP file produced from this workflow to test the plugin.

If a signing key is included in the Git repo, a signed build is automatically created, which you can use to test the plugin locally before submission.

By creating a release tag, the whole process becomes automated, resulting in a ZIP file that you can submit for publication in the [Grafana plugin catalog](https://grafana.com/plugins)

When you've packaged your plugin, proceed to [publishing a plugin](./publish-or-update-a-plugin.md) or [installing a packaged plugin](https://grafana.com/docs/grafana/latest/administration/plugin-management/#install-a-packaged-plugin).
