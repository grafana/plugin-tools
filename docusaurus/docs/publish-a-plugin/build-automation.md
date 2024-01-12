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

# Automated package and signing with CI

If the plugin has been setup to use the supplied git workflows from create-plugin,
the plugin will be built and packaged in the correct format.

The zip file produced can be used to test the plugin.

If a signing key is included in the git repo, a signed build is automatically created, which can be tested locally before submission.

By creating a release tag, the whole process is automated, resulting in a zip file that can be submitted for review on grafana.com

When you've packaged your plugin, you can proceed to [publishing a plugin](./publish-or-update-a-plugin.md) or [installing a packaged plugin](https://grafana.com/docs/grafana/latest/administration/plugin-management/#install-a-packaged-plugin).
