---
id: configurations
title: Test configurations
description: Testing the configuration editor of backend and frontend data sources with valid and invalid configuration
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - data-source
  - configuration editor
  - config
sidebar_position: 10
---

Most data source plugins need authentication to communicate with third-party services. The appropriate place to configure the connection details is the data source configuration page, and the details there must be valid so that the health check endpoint used to test the configuration works as expected.

### Test that the configuration editor loads

The following example is a simple smoke test that verifies that the data source configuration editor loads:

```ts title="configurationEditor.spec.ts"
import { test, expect } from '@grafana/plugin-e2e';

test('should render config editor', async ({ createDataSourceConfigPage, readProvisionedDataSource, page }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await createDataSourceConfigPage({ type: ds.type });
  await expect(page.getByLabel('Path')).toBeVisible();
});
```

### Testing the configuration in a backend data source plugin

Backend data sources implement a [health check](../../key-concepts/backend-plugins/#health-checks) endpoint that is used to test whether the configuration is valid or not. In the following example, the configuration editor form is populated with valid values then the `Save & test` button is clicked. Clicking `Save & test` calls the Grafana backend to save the configuration, then passes configuration to the plugin's backend health check endpoint. The test will be successful only if both calls yields a successful status code.

```ts title="configurationEditor.spec.ts"
import { test, expect } from '@grafana/plugin-e2e';
import { MyDataSourceOptions, MySecureJsonData } from './src/types';

test('"Save & test" should be successful when configuration is valid', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource<MyDataSourceOptions, MySecureJsonData>({ fileName: 'datasources.yml' });
  const configPage = await createDataSourceConfigPage({ type: ds.type });
  await page.getByLabel('Path').fill(ds.jsonData.path);
  await page.getByLabel('API Key').fill(ds.secureJsonData.apiKey);
  await expect(configPage.saveAndTest()).toBeOK();
});
```

#### Testing error scenarios

In some cases when the provided configuration is not valid, you may want to capture errors from the upstream API and return a meaningful error message to the user.

```ts title="configurationEditor.spec.ts"
test('"Save & test" should fail when configuration is invalid', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource<MyDataSourceOptions, MySecureJsonData>({ fileName: 'datasources.yml' });
  const configPage = await createDataSourceConfigPage({ type: ds.type });
  await page.getByLabel('Path').fill(ds.jsonData.path);
  await expect(configPage.saveAndTest()).not.toBeOK();
  await expect(configPage).toHaveAlert('error', { hasText: 'API key is missing' });
});
```

### Testing the configuration in a frontend data source plugin

Unlike backend data source plugins that always calls its own backend to perform a health check, frontend data source plugins may need make a call to a third-party API to test whether the provided configuration is valid. The `DataSourceConfigPage.saveAndTest` method allows you to provide a custom path for the endpoint that is being used to test the data source configuration.

```ts title="configurationEditor.spec.ts"
test('"Save & test" should be successful when configuration is valid', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  selectors,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  const configPage = await createDataSourceConfigPage({ type: ds.type });
  const healthCheckPath = `${selectors.apis.DataSource.proxy(configPage.datasource.uid)}/test`;
  await page.route(healthCheckPath, async (route) => await route.fulfill({ status: 200, body: 'OK' })
  // construct a custom health check url using the Grafana data source proxy
  const healthCheckPath = `${selectors.apis.DataSource.proxy(
    configPage.datasource.uid,
    configPage.datasource.id.toString()
  )}/third-party-service-path`;
  await expect(configPage.saveAndTest({ path: healthCheckPath })).toBeOK();
});
```

Additionally, you can assert that a success alert box is displayed on the page.

```ts title="configurationEditor.spec.ts"
test('"Save & test" should display success alert box when config is valid', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  const configPage = await createDataSourceConfigPage({ type: ds.type });
  // construct a custom health check url using the Grafana data source proxy
  const healthCheckPath = `${selectors.apis.DataSource.proxy(
    configPage.datasource.uid,
    configPage.datasource.id.toString()
  )}/third-party-service-path`;
  await page.route(healthCheckPath, async (route) => await route.fulfill({ status: 200, body: 'OK' }));
  await expect(configPage.saveAndTest({ path: healthCheckPath })).toBeOK();
  await expect(configPage).toHaveAlert('success');
});
```

### Testing a provisioned data source

Sometimes you may want to open the configuration editor for an already existing data source instance to verify configuration work as expected.

```ts
test('provisioned data source with valid credentials should return a 200 status code', async ({
  readProvisionedDataSource,
  gotoDataSourceConfigPage,
}) => {
  const datasource = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  const configPage = await gotoDataSourceConfigPage(datasource.uid);
  await expect(configPage.saveAndTest()).toBeOK();
});
```
