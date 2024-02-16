---
id: feature-toggles
title: Use Grafana feature toggles
description: How to use Grafana feature toggles in E2E tests
draft: true
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - feature toggles
sidebar_position: 50
---

# Introduction

Grafana uses a mechanism known as [feature toggles](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/feature-toggles/) to enable code to be turned "on" or "off" at runtime. Plugins can optionally react to the state of a feature toggle to change their behaviour as appropriate, if they do, it can be beneficial to cover this within your end-to-end (E2E) tests. This guide describes the features of `@grafana/plugin-e2e` that make it easier to work with feature toggles.

## Passing feature toggle configuration to Grafana

The easisest way to configure feature toggles that are available across the entire Grafana stack is to specify the [environment variables](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#override-configuration-with-environment-variables) operational when starting your Grafana instance.

## Override frontend feature toggles in E2E tests

`@grafana/plugin-e2e` allows you to override the frontend feature toggles that Grafana is configured to use. You can do that by specifying the custom option `featureToggles` in the Playwright config file.

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import { PluginOptions } from '@grafana/plugin-e2e';

export default defineConfig<PluginOptions>({
  testDir: './tests',
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    featureToggles: {
      experimentalPluginQueryEditor: false,
      experimentalPluginConfigEditor: true,
    },
  },
  ...
}
```

:::note

Feature toggles that are defined this way are propagated to `window.grafanaBootData.settings.featureToggles`. This means they will only have an impact on the frontend of Grafana. If you need the feature toggle to have an impact across the entire stack, see the [previous section](#passing-feature-toggles-to-grafana).

:::

### Override feature toggles in a specific test file

You can override feature toggles for tests in a certain test file.

```typescript
import { test, expect } from '@grafana/plugin-e2e';

test.use({
  featureToggles: {
    experimentalPluginQueryEditor: true,
  },
});
```

## Check whether a feature is enabled in your test

Use the `isFeatureToggleEnabled` fixture to determine whether a certain feature toggle is enabled. Under the hood, `isFeatureToggleEnabled` checks whether the given feature is defined and enabled in the `window.grafanaBootData.settings.featureToggles` object.

```typescript
import { test, expect } from '@grafana/plugin-e2e';
import * as semver from 'semver';

test('valid credentials should return a 200 status code', async ({
  createDataSourceConfigPage,
  page,
  isFeatureToggleEnabled,
}) => {
  const configPage = await createDataSourceConfigPage({ type: 'grafana-snowflake-datasource' });
  await configPage.getByTestIdOrAriaLabel('Data source connection URL').fill('http://localhost:9090');
  const isSecureSocksDSProxyEnabled = await isFeatureToggleEnabled('secureSocksDSProxyEnabled');
  if (isSecureSocksDSProxyEnabled) {
    page.getByLabel('Enabled').check();
  }
  await expect(configPage.saveAndTest()).toBeOK();
});
```
