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

import ScaffoldPluginE2ECreateDSPluginNPM from '@snippets/plugin-e2e-create-ds-plugin.npm.md';
import ScaffoldPluginE2ECreateDSPluginYarn from '@snippets/plugin-e2e-create-ds-plugin.yarn.md';
import ScaffoldPluginE2ECreateDSPluginPNPM from '@snippets/plugin-e2e-create-ds-plugin.pnpm.md';
import ScaffoldPluginE2InstallNPM from '@snippets/plugin-e2e-install.npm.md';
import ScaffoldPluginE2EInstallPNPM from '@snippets/plugin-e2e-install.pnpm.md';
import ScaffoldPluginE2EInstallYarn from '@snippets/plugin-e2e-install.yarn.md';
import ScaffoldPluginE2EStartGrafanaNPM from '@snippets/plugin-e2e-start-grafana.npm.md';
import ScaffoldPluginE2EStartGrafanaPNPM from '@snippets/plugin-e2e-start-grafana.pnpm.md';
import ScaffoldPluginE2EStartGrafanaYarn from '@snippets/plugin-e2e-start-grafana.yarn.md';
import ScaffoldPluginE2ERunTestsNPM from '@snippets/plugin-e2e-run-tests.npm.md';
import ScaffoldPluginE2ERunTestsPNPM from '@snippets/plugin-e2e-run-tests.pnpm.md';
import ScaffoldPluginE2ERunTestsYarn from '@snippets/plugin-e2e-run-tests.yarn.md';
import ScaffoldPluginE2EDSWorkflowNPM from '@snippets/plugin-e2e-ds-workflow.npm.md';
import ScaffoldPluginE2EDSWorkflowYarn from '@snippets/plugin-e2e-ds-workflow.yarn.md';
import ScaffoldPluginE2EDSWorkflowPNPM from '@snippets/plugin-e2e-ds-workflow.pnpm.md';

This guide walks you through how to get started with end-to-end testing in your plugin.

**You will learn:**

- how to install `@grafana/plugin-e2e`
- how to configure authentication
- how to write tests
- how to setup a basic Github workflow that runs tests against multiple versions of Grafana

:::warning
`@grafana/plugin-e2e` is still in beta and subject to breaking changes.
:::

## Prerequisites

- You need to have a Grafana plugin [development environment](https://grafana.com/developers/plugin-tools/get-started/set-up-development-environment)
- Node.js 18+
- Basic Knowledge of Playwright. If you have not worked with Playwright before, we recommend following the [Getting started](https://playwright.dev/docs/intro) section in their documentation

### Installing Playwright

`@grafana/plugin-e2e` extends Playwright APIs, so you need to have `@playwright/test` with a minimum version of 1.41.2 installed as a dev dependency in the package.json file of your plugin. Please refer to the [Playwright documentation](https://playwright.dev/docs/intro#installing-playwright) for instruction on how to install. Make sure you can run the example tests that were generated when you installed Playwright before you proceed to the next step in this guide.

## Set up @grafana/plugin-e2e

Optional: If you would like to follow along with our example tests, use the [create-plugin](../get-started/get-started.mdx) tool to generate a backend data source plugin.

<CodeSnippets
snippets={[
{ component: ScaffoldPluginE2ECreateDSPluginNPM, label: 'npm' },
{ component: ScaffoldPluginE2ECreateDSPluginYarn, label: 'yarn' },
{ component: ScaffoldPluginE2ECreateDSPluginPNPM, label: 'pnpm' }
]}
groupId="package-manager"
queryString="current-package-manager"
/>

### Step 1: Installing `@grafana/plugin-e2e`

Now open the terminal and run the following command in your plugin's project directory:

<CodeSnippets
snippets={[
{ component: ScaffoldPluginE2InstallNPM, label: 'npm' },
{ component: ScaffoldPluginE2EInstallYarn, label: 'yarn' },
{ component: ScaffoldPluginE2EInstallPNPM, label: 'pnpm' }
]}
groupId="package-manager"
queryString="current-package-manager"
/>

### Step 2: Configure Playwright

Open the Playwright config file that was generated when Playwright was installed.

1. Uncomment `baseUrl` and change it to `'http://localhost:3000'`.

```ts title="playwright.config.ts"
  baseURL: 'http://localhost:3000',
```

2. Playwright uses [projects](https://playwright.dev/docs/test-projects) to logically group tests that have the same configuration. We're going to add two projects:

   1. `auth` is a setup project will login to Grafana and store the authenticated state on disk.
   2. `run-tests` runs all the tests in a browser of choice. By adding a dependency to the `auth` project we ensure login only happens once, and all tests in the `run-tests` project will start already authenticated.

   Your Playwright config should have the following project configuration:

```ts title="playwright.config.ts"
import { dirname } from 'path';
import { defineConfig, devices } from '@playwright/test';

const pluginE2eAuth = `${dirname(require.resolve('@grafana/plugin-e2e'))}/auth`;

export default defineConfig({
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
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['auth'],
    }
  ],
});
```

The authenticated state is stored on disk and the file name pattern is as follows: `<plugin-root>/playwright/.auth/<username>.json`. To prevent these files from being version controlled, you can add the following line to your `.gitignore` file.

```shell title=".gitignore"
/playwright/.auth/
```

### Step 3: Start Grafana

Next, start up the latest version of Grafana on your local machine.

<CodeSnippets
snippets={[
{ component: ScaffoldPluginE2EStartGrafanaNPM, label: 'npm' },
{ component: ScaffoldPluginE2EStartGrafanaYarn, label: 'yarn' },
{ component: ScaffoldPluginE2EStartGrafanaPNPM, label: 'pnpm' }
]}
groupId="package-manager"
queryString="current-package-manager"
/>

If you want to start a specific version of Grafana, you can do that by specifying the `GRAFANA_VERSION` environment variable.

```bash
GRAFANA_VERSION=10.1.6 npm run server
```

### Step 4: Write tests

While installing Playwright in your project, a few example test files were generatated. We won't need those, so you can go ahead and delete these files.

You are now ready to write your tests. In this example, we're using the panel edit page to test the query editor for a backend data source plugin. The plugin was scaffolded with the [create-plugin](../get-started/get-started.mdx) tool, and for this data source the query endpoint returns hard coded data points. This test asserts that the values `1` and `3` are being displayed in the `Table` panel.

```ts title="queryEditor.spec.ts"
import { test, expect } from '@grafana/plugin-e2e';

test('data query should return values 1 and 3', async ({ panelEditPage, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.setVisualization('Table');
  await expect(panelEditPage.refreshPanel()).toBeOK();
  await expect(panelEditPage.panel.data).toContainText(['1', '3']);
});
```

### Step 5: Run tests

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

### Step 6: Run tests in CI

We recommend using a CI workflow to run end-to-end tests to continuously check for breakages. The following Github workflow will run end-to-end tests against a range of Grafana versions for every PR in your Github repository.

:::note
This is a generic example based on a backend plugin. You may need to alter or remove some of the steps in the `playwright-tests` job before using it in your plugin.
:::

<CodeSnippets
snippets={[
{ component: ScaffoldPluginE2EDSWorkflowNPM, label: 'npm' },
{ component: ScaffoldPluginE2EDSWorkflowYarn, label: 'yarn' },
{ component: ScaffoldPluginE2EDSWorkflowPNPM, label: 'pnpm' }
]}
groupId="package-manager"
queryString="current-package-manager"
/>
