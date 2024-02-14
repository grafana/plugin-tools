---
id: getting-started
title: Getting started
description: Getting started
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - getting-started
sidebar_position: 2
---

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
import ScaffoldPluginE2EProjectsConfigNPM from '@snippets/plugin-e2e-auth-project.npm.md';
import ScaffoldPluginE2EProjectsConfigYarn from '@snippets/plugin-e2e-auth-project.yarn.md';
import ScaffoldPluginE2EProjectsConfigPNPM from '@snippets/plugin-e2e-auth-project.pnpm.md';

# Getting started

This article will guide through how to install and configure `@grafana/plugin-e2e`, write tests and setup a basic Github workflow that can run your e2e tests targeting multiple versions of Grafana.

## Prerequisites

- You need to have a Grafana plugin [development environment](https://grafana.com/developers/plugin-tools/get-started/set-up-development-environment)
- Node.js 18+
- Docker
- Basic Knowledge of Playwright. If you have not worked with Playwright before, we recommend following the [Getting started](https://playwright.dev/docs/intro) section in their documentation.

### Installing Playwright

Please refer to the [Playwright documentation](https://playwright.dev/docs/intro#installing-playwright) for instruction on how to install. `@grafana/plugin-e2e` extends Playwright APIs, so you need to have `Playwright/test` with a minimum version of 0.40.0 installed as a dev dependency in the package.json file of your plugin.

## Set up `plugin-e2e`

### Step 1: Installing @grafana/plugin-e2e

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

2. Playwright uses [projects](https://playwright.dev/docs/test-projects) to logically group tests that have the same configuration. We're going to add two projects. The first project called `auth` is a setup project will login to Grafana and store the authenticated state on disk. The second project `run-tests` runs all the tests in a browser of choice. By adding a dependency to the `auth` project we ensure login only happens once, and all tests in the `run-tests` project will start already authenticated.

   Your Playwright config should have the following project configuration:

<CodeSnippets
snippets={[
{ component: ScaffoldPluginE2EProjectsConfigNPM, label: 'npm' },
{ component: ScaffoldPluginE2EProjectsConfigYarn, label: 'yarn' },
{ component: ScaffoldPluginE2EProjectsConfigPNPM, label: 'pnpm' }
]}
groupId="package-manager"
queryString="current-package-manager"
/>

```ts title="playwright.config.ts"
projects: [
  {
    name: 'auth',
    testDir: 'node_modules/@grafana/plugin-e2e/dist/auth',
    testMatch: [/.*\.js/],
  }
```

### Step 3: Provision any required Grafana resources

If testing your plugin requires certain resources to exist on your Grafana instance, you may use [provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/) to configure those.

The e2e tests that we'll write in this guide requires the Infinity Data Source plugin to be configured, so the following provisioning file is added to the `provisioning/datasources` folder.

```yml title="infinity.yaml"
apiVersion: 1
deleteDatasources:
  - name: Infinity E2E
    orgId: 1
datasources:
  - name: Infinity E2E
    type: yesoreyeram-infinity-datasource
```

### Step 4: Start Grafana

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

## Write tests

In this example, we're using the panel edit page to test a data source plugin. When the provided query is valid, the response status code is expected to be in the range 200-299.

```ts title="queryEditor.spec.ts"
import { test, expect } from '@grafana/plugin-e2e';

test('data query should return values 1 and 3', async ({ panelEditPage, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yaml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.setVisualization('Table');
  await expect(panelEditPage.refreshPanel()).toBeOK();
  await expect(panelEditPage.panel.data).toContainText(['1', '3']);
});
```

### Step 5: Run tests

Now you open a new terminal and run the test script from within your local plugin development directory.

<CodeSnippets
snippets={[
{ component: ScaffoldPluginE2ERunTestsNPM, label: 'npm' },
{ component: ScaffoldPluginE2ERunTestsYarn, label: 'yarn' },
{ component: ScaffoldPluginE2ERunTestsPNPM, label: 'pnpm' }
]}
groupId="package-manager"
queryString="current-package-manager"
/>

### CI

The following workflow can be used to run e2e tests against a matrix of Grafana versions for every PR in your Github repository. Note that this is a generic example based on a backend plugin. You may want to alter or remove a few of the steps in the `playwright-tests` job before using it in your plugin.

<CodeSnippets
snippets={[
{ component: ScaffoldPluginE2EDSWorkflowNPM, label: 'npm' },
{ component: ScaffoldPluginE2EDSWorkflowYarn, label: 'yarn' },
{ component: ScaffoldPluginE2EDSWorkflowPNPM, label: 'pnpm' }
]}
groupId="package-manager"
queryString="current-package-manager"
/>
