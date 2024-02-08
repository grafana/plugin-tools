---
id: feature-toggles
title: Feature toggles
description: How to use feature toggles in e2e tests
draft: true
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - feature toggles
sidebar_position: 1
---

# Introduction

Feature toggles are used to enable or disable features in Grafana. Feature toggles can have big impact on how a plugin behaves, so you may need to cater for that within you e2e tests. `@grafana/plugin-e2e` has a few fixtures that helps while working with feature toggles.

## Passing feature toggles to Grafana

The easisest way to configure feature toggles that are available across the entire Grafana stack is by specifying [environment variables](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#override-configuration-with-environment-variables) when starting your Grafana instance.

## Overriding frontend feature toggles in e2e tests

`@grafana/plugin-e2e` allows you to override the frontend feature toggles that Grafana is configured to use. You can do that by specifying the custom option `featureToggles` in the playwright config.

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

:::note Feature toggles that are defined this way are propagated to `window.grafanaBootData.settings.featureToggles`. This means they will only have an impact on the frontend of Grafana. If you need the feature toggle to have an impact across the entire stack, see the [previous section](#passing-feature-toggles-to-grafana).
:::

### Overriding feature toggles in a specific test file

You can override feature toggles for tests in a certain test file.

```typescript
import { test, expect } from '@grafana/plugin-e2e';

test.use({
  featureToggles: {
    experimentalPluginQueryEditor: true,
  },
});
```

## Checking whether a feature is enabled or not

You may use the `isFeatureToggleEnabled` fixture to checks whether a certain frontend feature toggle is enabled or not. Under the hood, `isFeatureToggleEnabled` checks whether the given feature is defined and enabled in the `window.grafanaBootData.settings.featureToggles` object.

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
