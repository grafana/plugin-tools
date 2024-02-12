---
id: install-plugin-e2e
title: Installation and setup
description: How to install and set up @grafana/plugin-e2e.
draft: true
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Introduction

Plugin authors typically want their plugins to be compatible with a range of Grafana versions. This can be challenging as things such as environment, APIs and UI components may differ from one Grafana version to another. Manually testing a plugin across multiple versions of Grafana is a tedious process, so in most cases E2E testing offers a better solution.

[`@grafana/plugin-e2e`](https://www.npmjs.com/package/@grafana/plugin-e2e?activeTab=readme) is designed specifically for Grafana plugin developers. It extends [`Playwright test`](https://playwright.dev/) capabilities with relevant fixtures, models, and expect matchers; enabling comprehensive end-to-end testing of Grafana plugins across multiple versions of Grafana. This package simplifies the testing process, ensuring your plugin is robust and compatible with various Grafana environments.

## Prerequisites

- You need to have a Grafana plugin [development environment](https://grafana.com/developers/plugin-tools/get-started/set-up-development-environment)
- Node.js 18+
- Docker
- Basic Knowledge of Playwright. If you have not worked with Playwright before, we recommend following the [Getting started](https://playwright.dev/docs/intro) section in their documentation.

## Installing Playwright

Please refer to the [Playwright documentation](https://playwright.dev/docs/intro#installing-playwright) for instruction on how to install. `@grafana/plugin-e2e` extends Playwright APIs, so you need to have `Playwright/test` with a minimum version of 0.40.0 installed as a dev-devdependency in the package.json file of your plugin.

## Set up `plugin-e2e`

### Step 1: Installing @grafana/plugin-e2e

Now open the terminal, cd into your plugin root folder and install `@grafana/plugin-e2e`.

<Tabs
defaultValue="npm">
<TabItem value="npm">

```bash
npm install @grafana/plugin-e2e@latest --save-dev
```

</TabItem>

<TabItem value="yarn">

```bash
yarn add @grafana/plugin-e2e@latest --dev
```

</TabItem>

<TabItem value="pnpm">

```bash
yarn add @grafana/plugin-e2e@latest -D
```

</TabItem>
</Tabs>

### Step 2: Configure Playwright

Open the `playwright.config.[js|ts]` file that was generated when Playwright was installed.

1. Change the `baseUrl` to `'http://localhost:3000'`.

```ts
// playwright.config.ts
use: {
  baseURL: 'http://localhost:3000',
  ...
}
```

2. Add a new `auth` initialization project. This will login to Grafana and store the cookie on disk.

```ts
projects: [
  {
    name: 'auth',
    testDir: 'node_modules/@grafana/plugin-e2e/dist/auth',
    testMatch: [/.*\.js/],
  }
```

3. Then add a dependency for this project in any browser project you want to run tests against. For example, the code below will ensure that all tests in the `chromium` project will load and reuse the authenticated state from the `auth` project.

```ts
projects: [
  {
    name: 'auth',
    testDir: 'node_modules/@grafana/plugin-e2e/dist/auth',
    testMatch: [/.*\.js/],
  },
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.auth/user.json',
    },
    dependencies: ['auth'],
  },
],
```

### Step 3: Provision any required Grafana resources

In many cases, plugin E2E tests rely on the existence of a properly configured data source plugin. We accomplish that using provisioning.

```yml
apiVersion: 1
deleteDatasources:
  - name: Infinity E2E
    orgId: 1
datasources:
  - name: Infinity E2E
    type: yesoreyeram-infinity-datasource
```

For details on how to provision Grafana, refer to the [documentation](https://grafana.com/docs/grafana/latest/administration/provisioning/).

### Step 4: Start Grafana

Next, startup the Grafana instance locally.

<Tabs defaultValue="npm">
<TabItem value="npm">

```bash
npm run server
```

</TabItem>

<TabItem value="yarn">

```bash
yarn server
```

</TabItem>

<TabItem value="pnpm">

```bash
pnpm server
```

</TabItem>
</Tabs>

### Step 5: Run tests

Now you can open the terminal and run the test script from within your local plugin development directory.

<Tabs
defaultValue="npm">
<TabItem value="npm">

```bash
npx playwright test
```

</TabItem>

<TabItem value="yarn">

```bash
yarn playwright test
```

</TabItem>

<TabItem value="pnpm">

```bash
pnpm playwright test
```

</TabItem>
</Tabs>
