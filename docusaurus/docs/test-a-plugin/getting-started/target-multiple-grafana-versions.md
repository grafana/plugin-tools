---
id: target-multiple-grafana-versions
title: Target multiple Grafana versions
description: Test a plugin against multiple Grafana versions
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - ci
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Introduction

`@grafana/plugin-e2e` is tested with all minor versions of Grafana since 8.3.0. This article provides examples on how to run e2e tests targeting different Grafana versions locally and in CI.

## On your local machine

In the [installation](./installation.md#start-grafana) guide you saw how to start Grafana by running `npm run server`. When running this command, the latest Grafana Enterprise image will be used. If you want to target a different version of Grafana in your e2e tests, you can use the `GRAFANA_VERSION` environment variable to specify a version of choice. Repeat the process of spinning up a version of Grafana and running your tests to validate against the different versions.

<Tabs defaultValue="npm">
<TabItem value="npm">

```bash
GRAFANA_VERSION=10.1.6 npm run server
```

</TabItem>

<TabItem value="yarn">

```bash
GRAFANA_VERSION=10.1.6 yarn server
```

</TabItem>

<TabItem value="pnpm">

```bash
GRAFANA_VERSION=10.1.6 pnpm server
```

</TabItem>
</Tabs>

## CI

The following workflow can be used to run e2e tests against a matrix of Grafana versions for every PR in your Github repository. Note that this is a generic example based on a backend plugin. You may want to alter or remove a few of the steps in the `playwright-tests` job before using it in your plugin.

<Tabs defaultValue="npm">
<TabItem value="npm">

```yaml
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

```yaml
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

```yaml
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
