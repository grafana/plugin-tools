---
id: ci
title: Continuous Integration
---

@grafana/create-plugin comes with several GitHub workflows that help automate the plugin development process.

## Continuous Integration (`ci.yml`)

The Continuous Integration (`ci.yml`) workflow is designed to lint, type check, build the frontend and backend, and run tests on your plugin every time you push changes to your repository. This helps catch any issues early in the development process, before they become bigger problems.

## Release (`release.yml`)

:::caution

This workflow requires a Grafana Cloud API key. Follow the instructions for [distributing your plugin](./distributing-your-plugin.md#initial-steps) first.

:::

The Release (`release.yml`) workflow is designed to create a new release of your plugin whenever you're ready to publish a new version. This automates the process of creating releases in GitHub and provides instructions for submitting the plugin to the Grafana plugins catalog.

To trigger the release workflow push a git tag for the plugin version you want to release.

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Compatibility Check (`is-compatible.yml`)

The Compatibility Check (`is-compatible.yml`) workflow is designed to check the Grafana API compatibility of your plugin every time you push changes to your repository. This helps catch potential frontend runtime issues by:

1. Finding `@grafana` npm packages in your plugin.
1. Extracting the exported types of the specified version.
1. Comparing the differences between that version and the latest version.
1. Looking for usages of those changed APIs inside your plugin.
1. Reporting any potential incompatibilities.
