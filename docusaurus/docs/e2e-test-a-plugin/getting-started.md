---
id: getting-started
title: Getting started
description: Getting started
draft: true
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - getting-started
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

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
pnpm add @grafana/plugin-e2e@latest -D
```

</TabItem>
</Tabs>

### Step 2: Configure Playwright

Open the `playwright.config.[js|ts]` file that was generated when Playwright was installed.

1. Change the `baseUrl` to `'http://localhost:3000'`.

```ts title="playwright.config.ts"
use: {
  baseURL: 'http://localhost:3000',
  ...
}
```

2. Add a new `auth` setup project. This will login to Grafana and store the authenticated state on disk.

```ts title="playwright.config.ts"
projects: [
  {
    name: 'auth',
    testDir: 'node_modules/@grafana/plugin-e2e/dist/auth',
    testMatch: [/.*\.js/],
  }
```

3. Then add another project that runs all the tests in a browser of choice. This project needs to depend on the `auth` project we added in the previous step. That will ensure login only happens once, and all tests in the `run-tests` project will start already authenticated.

```ts title="playwright.config.ts"
projects: [
  {
    name: 'auth',
    testDir: 'node_modules/@grafana/plugin-e2e/dist/auth',
    testMatch: [/.*\.js/],
  },
  {
    name: 'run-tests',
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.auth/admin.json',
    },
    dependencies: ['auth'],
  },
],
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

If you wish to start a specific version of Grafana, you can do that by specifying the `GRAFANA_VERSION` environment variable.

```bash
GRAFANA_VERSION=10.1.6 npm run server
```

## Write tests

In this example, we're using the panel edit page to test a data source plugin. When the provided query is valid, the response status code is expected to be in the range 200-299.

```ts
import { test, expect } from '@grafana/plugin-e2e';

test('data query should be OK when URL is valid', async ({ panelEditPage, page }) => {
  const API_URL = 'https://jsonplaceholder.typicode.com/users';
  await panelEditPage.datasource.set('Infinity E2E');
  await page.getByTestId('infinity-query-url-input').fill(API_URL);
  await expect(panelEditPage.refreshPanel()).toBeOK();
});
```

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

### CI

The following workflow can be used to run e2e tests against a matrix of Grafana versions for every PR in your Github repository. Note that this is a generic example based on a backend plugin. You may want to alter or remove a few of the steps in the `playwright-tests` job before using it in your plugin.

<Tabs defaultValue="npm">
<TabItem value="npm">

```yaml title=".github/workflows/e2e.yml"
name: E2E tests
on:
  pull_request:

permissions:
  contents: read
  id-token: write

jobs:
  resolve-versions:
    name: Resolve Grafana images
    runs-on: ubuntu-latest
    timeout-minutes: 3
    outputs:
      matrix: ${{ steps.resolve-versions.outputs.matrix }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Resolve Grafana E2E versions
        id: resolve-versions
        uses: grafana/plugin-actions/e2e-version@main

  playwright-tests:
    needs: resolve-versions
    timeout-minutes: 60
    strategy:
      fail-fast: false
      matrix:
        GRAFANA_IMAGE: ${{fromJson(needs.resolve-versions.outputs.matrix)}}
    name: e2e ${{ matrix.GRAFANA_IMAGE.name }}@${{ matrix.GRAFANA_IMAGE.VERSION }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js environment
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc

      - name: Install Mage
        uses: magefile/mage-action@v3
        with:
          install-only: true

      - name: Install npm dependencies
        run: npm ci

      - name: Build binaries
        run: mage -v build:linux

      - name: Build frontend
        run: npm run build

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Start Grafana
        run: |
          docker-compose pull
          GRAFANA_VERSION=${{ matrix.GRAFANA_IMAGE.VERSION }} GRAFANA_IMAGE=${{ matrix.GRAFANA_IMAGE.NAME }} docker-compose up -d

      - name: Wait for Grafana to start
        uses: nev7n/wait_for_response@v1
        with:
          url: 'http://localhost:3000/'
          responseCode: 200
          timeout: 60000
          interval: 500

      - name: Run Playwright tests
        id: run-tests
        run: npx playwright test

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        if: ${{ (always() && steps.run-tests.outcome == 'success') || (failure() && steps.run-tests.outcome == 'failure') && github.event.organization.login != 'grafana' }}
        with:
          name: playwright-report-${{ matrix.GRAFANA_IMAGE.NAME }}-v${{ matrix.GRAFANA_IMAGE.VERSION }}-${{github.run_id}}
          path: playwright-report/
          retention-days: 30

      - name: Publish report to GCS
        if: ${{ (always() && steps.run-tests.outcome == 'success') || (failure() && steps.run-tests.outcome == 'failure') && github.event.organization.login == 'grafana' }}
        uses: grafana/plugin-actions/publish-report@main
        with:
          grafana-version: ${{ matrix.GRAFANA_IMAGE.VERSION }}
```

</TabItem>

<TabItem value="yarn">

```yaml title=".github/workflows/e2e.yml"
name: E2E tests
on:
  pull_request:

permissions:
  contents: read
  id-token: write

jobs:
  resolve-versions:
    name: Resolve Grafana images
    runs-on: ubuntu-latest
    timeout-minutes: 3
    outputs:
      matrix: ${{ steps.resolve-versions.outputs.matrix }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Resolve Grafana E2E versions
        id: resolve-versions
        uses: grafana/plugin-actions/e2e-version@main

  playwright-tests:
    needs: resolve-versions
    timeout-minutes: 60
    strategy:
      fail-fast: false
      matrix:
        GRAFANA_IMAGE: ${{fromJson(needs.resolve-versions.outputs.matrix)}}
    name: e2e ${{ matrix.GRAFANA_IMAGE.name }}@${{ matrix.GRAFANA_IMAGE.VERSION }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js environment
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc

      - name: Install Mage
        uses: magefile/mage-action@v3
        with:
          install-only: true

      - name: Install yarn dependencies
        run: yarn install

      - name: Build binaries
        run: mage -v build:linux

      - name: Build frontend
        run: yarn build

      - name: Install Playwright Browsers
        run: yarn playwright install --with-deps

      - name: Start Grafana
        run: |
          docker-compose pull
          GRAFANA_VERSION=${{ matrix.GRAFANA_IMAGE.VERSION }} GRAFANA_IMAGE=${{ matrix.GRAFANA_IMAGE.NAME }} docker-compose up -d

      - name: Wait for Grafana to start
        uses: nev7n/wait_for_response@v1
        with:
          url: 'http://localhost:3000/'
          responseCode: 200
          timeout: 60000
          interval: 500

      - name: Run Playwright tests
        id: run-tests
        run: yarn playwright test

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        if: ${{ (always() && steps.run-tests.outcome == 'success') || (failure() && steps.run-tests.outcome == 'failure') && github.event.organization.login != 'grafana' }}
        with:
          name: playwright-report-${{ matrix.GRAFANA_IMAGE.NAME }}-v${{ matrix.GRAFANA_IMAGE.VERSION }}-${{github.run_id}}
          path: playwright-report/
          retention-days: 30

      - name: Publish report to GCS
        if: ${{ (always() && steps.run-tests.outcome == 'success') || (failure() && steps.run-tests.outcome == 'failure') && github.event.organization.login == 'grafana' }}
        uses: grafana/plugin-actions/publish-report@main
        with:
          grafana-version: ${{ matrix.GRAFANA_IMAGE.VERSION }}
```

</TabItem>

<TabItem value="pnpm">

```yaml title=".github/workflows/e2e.yml"
name: E2E tests
on:
  pull_request:

permissions:
  contents: read
  id-token: write

jobs:
  resolve-versions:
    name: Resolve Grafana images
    runs-on: ubuntu-latest
    timeout-minutes: 3
    outputs:
      matrix: ${{ steps.resolve-versions.outputs.matrix }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Resolve Grafana E2E versions
        id: resolve-versions
        uses: grafana/plugin-actions/e2e-version@main

  playwright-tests:
    needs: resolve-versions
    timeout-minutes: 60
    strategy:
      fail-fast: false
      matrix:
        GRAFANA_IMAGE: ${{fromJson(needs.resolve-versions.outputs.matrix)}}
    name: e2e ${{ matrix.GRAFANA_IMAGE.name }}@${{ matrix.GRAFANA_IMAGE.VERSION }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: ^6.10.0

      - name: Setup Node.js environment
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc

      - name: Install Mage
        uses: magefile/mage-action@v3
        with:
          install-only: true

      - name: Install pnpm dependencies
        run: pnpm install --frozen-lockfile

      - name: Build binaries
        run: mage -v build:linux

      - name: Build frontend
        run: pnpm run build

      - name: Install Playwright Browsers
        run: pnpm playwright install --with-deps

      - name: Start Grafana
        run: |
          docker-compose pull
          GRAFANA_VERSION=${{ matrix.GRAFANA_IMAGE.VERSION }} GRAFANA_IMAGE=${{ matrix.GRAFANA_IMAGE.NAME }} docker-compose up -d

      - name: Wait for Grafana to start
        uses: nev7n/wait_for_response@v1
        with:
          url: 'http://localhost:3000/'
          responseCode: 200
          timeout: 60000
          interval: 500

      - name: Run Playwright tests
        id: run-tests
        run: pnpm playwright test

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        if: ${{ (always() && steps.run-tests.outcome == 'success') || (failure() && steps.run-tests.outcome == 'failure') && github.event.organization.login != 'grafana' }}
        with:
          name: playwright-report-${{ matrix.GRAFANA_IMAGE.NAME }}-v${{ matrix.GRAFANA_IMAGE.VERSION }}-${{github.run_id}}
          path: playwright-report/
          retention-days: 30

      - name: Publish report to GCS
        if: ${{ (always() && steps.run-tests.outcome == 'success') || (failure() && steps.run-tests.outcome == 'failure') && github.event.organization.login == 'grafana' }}
        uses: grafana/plugin-actions/publish-report@main
        with:
          grafana-version: ${{ matrix.GRAFANA_IMAGE.VERSION }}
```

</TabItem>
</Tabs>
```
