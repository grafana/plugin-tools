---
id: migrate-from-grafana-e2e
title: Migrate from @grafana/e2e
description: Migrate from @grafana/e2e to @grafana/plugin-e2e.
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - end-to-end
  - migrate
sidebar_position: 90
---

import ScaffoldPluginE2InstallNPM from '@shared/plugin-e2e-install.md';

:::danger
With the release of Grafana 11.0.0 the [`@grafana/e2e`](https://www.npmjs.com/package/@grafana/e2e) package has been deprecated and support has been dropped. We recommend all plugin authors to migrate their end-to-end tests to use Playwright and `@grafana/plugin-e2e` instead of Cypress and `@grafana/e2e`.
:::

In this guide you'll learn:

- how to manually setup `@grafana/plugin-e2e` in your plugin
- how to migrate tests
- how to run Playwright tests in CI
- how to uninstall Cypress and `@grafana/e2e`

## Manually installing @grafana/plugin-e2e

Plugins scaffolded with create-plugin v4.6.0 and greater automatically include configuration for `@grafana/plugin-e2e` and `@playwright/test`. To add this configuration manually, follow these steps:

### Step 1: Installing Playwright

The `@grafana/plugin-e2e` tool extends Playwright APIs, so you need to have `@playwright/test` with a minimum version of 1.41.2 installed as a dev dependency in the `package.json` file of your plugin. Refer to the [Playwright documentation](https://playwright.dev/docs/intro#installing-playwright) for instruction on how to install. Make sure you can run the example tests that were generated during the installation. If the example tests ran successfully, you may go ahead and delete them as they won't be needed anymore.

### Step 2: Installing `@grafana/plugin-e2e`

Open the terminal and run the following command in your plugin's project directory:

<ScaffoldPluginE2InstallNPM />

### Step 3: Configure Playwright

Open the Playwright config file that was generated when Playwright was installed.

1. Uncomment `baseUrl` and change it to `'http://localhost:3000'`.

```ts title="playwright.config.ts"
  baseURL: 'http://localhost:3000',
```

2. Playwright uses [projects](https://playwright.dev/docs/test-projects) to logically group tests that have the same configuration. We're going to add two projects:

   1. `auth` is a setup project that will log in to Grafana and store the authenticated state on disk.
   2. `run-tests` runs all the tests in your browser of choice. By adding a dependency to the `auth` project we ensure that login only happens once, and all tests in the `run-tests` project will start as already authenticated.

   Your Playwright config should have the following project configuration:

```ts title="playwright.config.ts"
import { dirname } from 'path';
import { defineConfig, devices } from '@playwright/test';
import type { PluginOptions } from '@grafana/plugin-e2e';

const pluginE2eAuth = `${dirname(require.resolve('@grafana/plugin-e2e'))}/auth`;

export default defineConfig<PluginOptions>({
    ...
    projects: [
    {
      name: 'auth',
      testDir: pluginE2eAuth,
      testMatch: [/.*\.js/],
    },
    {
      name: 'run-tests',
      use: {
        ...devices['Desktop Chrome'],
        // @grafana/plugin-e2e writes the auth state to this file,
        // the path should not be modified
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['auth'],
    }
  ],
});
```

The authenticated state is stored on disk with the following file name pattern: `<plugin-root>/playwright/.auth/<username>.json`.

To prevent these files from being version controlled, you can add the following line to your `.gitignore` file:

```shell title=".gitignore"
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
/playwright/.auth/
```

## Migrating from `@grafana/e2e`

Once you have Playwright and `@grafana/plugin-e2e` installed and configured, you can follow these steps to migrate from `@grafana/e2e`.

### Migrating tests

There's no tooling in place for automatically migrating existing `@grafana/e2e` based Cypress tests to `@grafana/plugin-e2e` based Playwright tests. This means you would have to convert your tests one by one or replace them with a new set of tests based on Playwright. Refer to the following resources to get inspiration on how the playwright tests should be written:

- [How to test data source plugins](./test-a-data-source-plugin/index.md)
- [How to test panel plugins](./test-a-panel-plugin.md)
- [Best practices around test isolation](./setup-resources.md#test-isolation)
- [How to select UI elements](./selecting-ui-elements.md)
- [Plugin examples repository](https://github.com/grafana/grafana-plugin-examples)

### Running tests in CI

To run Playwright tests targeting multiple versions of Grafana in CI, use one of the example workflows in the [CI](./ci.md) guide.

:::note

Note that Grafana does not offer any supported way to run end-to-end tests targeting multiple versions of Grafana in other CI platforms such as Drone or CircleCI. But you can easily configure your CI to replicate what the referenced Github Action is doing as there is nothing specific that we do that can not be done in other CI systems.

:::

### Uninstalling Cypress and @grafana/e2e

Although we recommend moving from `@grafana/e2e` to `@grafana/plugin-e2e` in a timely manner, there's nothing preventing you from having the two side by side during a transitional phase.

When all Cypress tests have been migrated, open the terminal and run the following scripts from within your local plugin development directory:

#### 1. Remove Cypress tests and config file

```shell
rm ./cypress.json
rm -rf ./cypress
```

#### 2. Uninstall dependencies

```shell
npm uninstall --save-dev @grafana/e2e @grafana/e2e-selectors
```

#### 3. Update scripts

In the `package.json` file, remove the `e2e:update` script entirely and change the `e2e` script to the following:

`"e2e": "playwright test",`
