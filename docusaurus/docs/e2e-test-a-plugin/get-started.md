---
id: get-started
title: Get started 
description: Get started with plugin end-to-end testing.
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

import ScaffoldPluginE2EStartGrafanaNPM from '@shared/plugin-e2e-start-grafana.md';
import ScaffoldPluginE2ERunTestsNPM from '@shared/plugin-e2e-run-tests.md';

The [create-plugin](https://www.npmjs.com/package/@grafana/create-plugin?activeTab=readme) tool automatically scaffolds the basic setup for `@grafana/plugin-e2e` to help you easily get started with end-to-end testing in your plugin. This guide walks you through the basic usage of running Playwright tests with `@grafana/plugin-e2e`.

:::note
If you scaffolded a plugin with a version of create-plugin prior to 4.6.0, follow the [migration guide](./migrate-from-grafana-e2e.md) for instruction on how to install and configure `@grafana/plugin-e2e` manually.
:::

## Before you begin

You need to have the following:

- Grafana [plugin development environment](/set-up/).
- Node.js version 18 or later.
- Basic knowledge of Playwright. If you have not worked with Playwright before, we recommend following the [Getting started](https://playwright.dev/docs/intro) section in their documentation.

### Step 1: Start Grafana

Start up the latest version of Grafana on your local machine like this:

<ScaffoldPluginE2EStartGrafanaNPM />

If you want to start a specific version of Grafana, you can do that by specifying the `GRAFANA_VERSION` environment variable. For example:

```bash
GRAFANA_VERSION=10.4.1 npm run server
```

### Step 2: Run tests

Open a new terminal and run the test script from within your local plugin development directory.

<ScaffoldPluginE2ERunTestsNPM />

### Step 3: Run tests in CI

The [`grafanaDependency`](../reference/metadata.md#dependencies) property in the `plugin.json` file specifies what versions of Grafana the plugin is compatible with. As a best practice, run your Playwright end-to-end tests targeting all the supported versions. The GitHub workflow that can be included when scaffolding plugins with `create-plugin` ensures this is the case.

If you chose to not add a GitHub workflow when you scaffolded the plugin, as a best practice follow the instructions in the [CI](./ci.md) guide to run Playwright end-to-end tests targeting all versions of Grafana that your plugin supports.

## What's next?

Next we suggest you checkout the following guides:

- [Selecting UI elements in end-to-end tests](./selecting-ui-elements.md)
- [Configure the resources you'll need](./setup-resources.md)
- [How to test data source plugins](./test-a-data-source-plugin/index.md)
- [How to test panel plugins](./test-a-panel-plugin.md)
