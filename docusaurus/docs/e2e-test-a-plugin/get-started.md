---
id: get-started
title: Get started
description: Get started
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - end-to-end
  - get-started
sidebar_position: 2
---

import ScaffoldPluginE2EStartGrafanaNPM from '@snippets/plugin-e2e-start-grafana.npm.md';
import ScaffoldPluginE2EStartGrafanaPNPM from '@snippets/plugin-e2e-start-grafana.pnpm.md';
import ScaffoldPluginE2EStartGrafanaYarn from '@snippets/plugin-e2e-start-grafana.yarn.md';
import ScaffoldPluginE2ERunTestsNPM from '@snippets/plugin-e2e-run-tests.npm.md';
import ScaffoldPluginE2ERunTestsPNPM from '@snippets/plugin-e2e-run-tests.pnpm.md';
import ScaffoldPluginE2ERunTestsYarn from '@snippets/plugin-e2e-run-tests.yarn.md';

This guide walks you through how to get started with end-to-end testing in your plugin with the `@grafana/plugin-e2e` tool.

:::note
The `create-plugin` tool started scaffolding basic setup for `@grafana/plugin-e2e` from version 4.5.0. If you already have a plugin and it was scaffolded with an earlier version of the `create-plugin` tool, you may follow the [migration](./migrate-from-grafana-e2e.md) guide for instruction on how to install and configure `@grafana/plugin-e2e` manually.
:::

## Before you begin

You need to have the following:

- Grafana [plugin development environment](https://grafana.com/developers/plugin-tools/get-started/set-up-development-environment)
- Node.js version 18 or later.
- Basic knowledge of Playwright. If you have not worked with Playwright before, we recommend following the [Getting started](https://playwright.dev/docs/intro) section in their documentation.

### Step 1: Start Grafana

Start up the latest version of Grafana on your local machine like this:

<CodeSnippets
snippets={[
{ component: ScaffoldPluginE2EStartGrafanaNPM, label: 'npm' },
{ component: ScaffoldPluginE2EStartGrafanaYarn, label: 'yarn' },
{ component: ScaffoldPluginE2EStartGrafanaPNPM, label: 'pnpm' }
]}
groupId="package-manager"
queryString="current-package-manager"
/>

If you want to start a specific version of Grafana, you can do that by specifying the `GRAFANA_VERSION` environment variable. For example:

```bash
GRAFANA_VERSION=10.4.1 npm run server
```

### Step 2: Run tests

Open a new terminal and run the test script from within your local plugin development directory.

<CodeSnippets
snippets={[
{ component: ScaffoldPluginE2ERunTestsNPM, label: 'npm' },
{ component: ScaffoldPluginE2ERunTestsYarn, label: 'yarn' },
{ component: ScaffoldPluginE2ERunTestsPNPM, label: 'pnpm' }
]}
groupId="package-manager"
queryString="current-package-manager"
/>

### Step 3: Setup CI

If you choose to add a Github workflow when you scaffolded the plugin, the Playwright end-to-end tests will be run in CI targeting the most recent version of Grafana. To take full advantage of plugin-e2e, it's recommended to follow the instructions in the [CI](./ci.md) guide to run Playwright end-to-end tests targeting all versions of Grafana that your plugin supports.

## What's next?

Next we suggest you checkout the following guides:

- [Selecting UI elements in end-to-end tests](./selecting-ui-elements.md)
- [Configure the resources you'll need](./setup-resources.md)
- [How to test data source plugins](./test-a-data-source-plugin/index.md)
<!-- - [How to test panel plugins](./test-a-panel-plugin.md) -->
