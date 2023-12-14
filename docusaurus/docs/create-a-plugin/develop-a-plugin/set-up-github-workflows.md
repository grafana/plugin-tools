---
id: set-up-github-workflows
title: Set up GitHub workflows
description: How to automate your plugin development process by using GitHub workflows.
keywords:
  - grafana
  - plugins
  - plugin
  - github
  - workflows
  - CI
  - continuous integration
  - automation
sidebar_position: 4
---

Automate your development process to minimize errors and make it faster and more cost-efficient. The `create-plugin` tool helps you to configure your GitHub actions workflows to help automate your development process.

## The CI workflow

The CI (`ci.yml`) workflow is designed to lint, type check, and build the frontend and backend. It is also used to run tests on your plugin every time you push changes to your repository. The `create-plugin` tool helps to catch any issues early in the development process, before they become bigger problems.

## The release workflow

:::warning

This workflow requires a Grafana Cloud API key. Before you begin, follow the instructions for [distributing your plugin](../../publish-a-plugin/publish-or-update-a-plugin.md).

:::

The release (`release.yml`) workflow is designed to create a new release of your plugin whenever you're ready to publish a new version. This automates the process of creating releases in GitHub and provides instructions for submitting the plugin to the Grafana plugin catalog.

To trigger the release workflow, push a Git tag for the plugin version that you want to release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## The compatibility check (`is-compatible.yml`)

The compatibility check (`is-compatible.yml`) workflow is designed to check the Grafana API compatibility of your plugin every time you push changes to your repository. This helps to catch potential frontend runtime issues before they occur.

The workflow contains the following steps:

1. Finding `@grafana` npm packages in your plugin.
1. Extracting the exported types of the specified version.
1. Comparing the differences between that version and the latest version.
1. Looking for usages of those changed APIs inside your plugin.
1. Reporting any potential incompatibilities.
