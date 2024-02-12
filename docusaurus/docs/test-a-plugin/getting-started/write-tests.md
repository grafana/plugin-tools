---
id: writing-tests
title: Writing tests
description: How to write tests for Grafana E2E
draft: true
keywords:
  - grafana
  - plugins
  - plugin
  - e2e
  - example test
sidebar_position: 2
---

# Write tests

After you have [set up Grafana Plugin E2E](installation.md), you are ready to write your first test.

In this example, we're using the panel edit page to test a data source plugin. When the provided query is valid, the response status code is expected to be in the range 200-299.

```typescript
import { test, expect } from '@grafana/plugin-e2e';

test('data query should be OK when URL is valid', async ({ panelEditPage, page }) => {
  const API_URL = 'https://jsonplaceholder.typicode.com/users';
  await panelEditPage.datasource.set('Infinity E2E');
  await page.getByTestId('infinity-query-url-input').fill(API_URL);
  await expect(panelEditPage.refreshPanel()).toBeOK();
});
```

<!-- ## Using `grafanaVersion` and `isFeatureToggleEnabled` fixtures -->'

## Fixtures of @grafana/plugin-e2e

In the next test, we're asserting that a new instance of the Snowflake data source can be configured successfully. Notice how the fixtures `isFeatureToggleEnabled` and `grafanaVersion` allow us to customize the test code in case a certain Grafana feature toggle is enabled and for specific Grafana versions.

```typescript
import { test, expect } from '@grafana/plugin-e2e';
import * as semver from 'semver';

test('valid credentials should return a 200 status code', async ({
  createDataSourceConfigPage,
  page,
  isFeatureToggleEnabled,
  grafanaVersion,
}) => {
  const configPage = await createDataSourceConfigPage({ type: 'grafana-snowflake-datasource' });
  await configPage.getByTestIdOrAriaLabel('Data source connection URL').fill('http://localhost:9090');
  const isSecureSocksDSProxyEnabled = await isFeatureToggleEnabled('secureSocksDSProxyEnabled');
  if (isSecureSocksDSProxyEnabled && semver.gte(grafanaVersion, '10.0.0')) {
    page.getByLabel('Enabled').check();
  }
  await expect(configPage.saveAndTest()).toBeOK();
});
```
