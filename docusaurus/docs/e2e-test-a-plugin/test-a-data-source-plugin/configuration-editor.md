---
id: configuration-editor
title: The configuration editor
description: Testing the configuration editor
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

Most data source plugins need auth to communicate with third-party services. Users can configure the connection details in the data source configuration page. Data source plugins that need auth cannot function without valid configuration, so it's crucial that the configuration page and the data source health check endpoint that is used to test the configuration work as expected.

### Testing the configuration in a backend data source plugin

Backend data sources implement a [health check](../../introduction/backend.md#health-checks) endpoint that is used to test whether the configuration is valid or not. In the following example, the configuration editor form is populated with valid values then the `Save & test` button is clicked. Clicking `Save & test` calls the Grafana backend to save the configuration, then passes configuration to the plugin's backend health check endpoint. The test will be successful only if both calls yields a successful status code.

```ts title="configurationEditor.spec.ts"
test('"Save & test" should be successful when configuration is valid', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = readProvisionedDataSource<JsonData, SecureJsonData>({ fileName: 'datasources.yaml' });
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
  const ds = await readProvisionedDataSource<JsonData, SecureJsonData>({ fileName: 'datasources.yaml' });
  const configPage = await createDataSourceConfigPage({ type: ds.type });
  await page.getByLabel('Path').fill(ds.jsonData.path);
  await expect(configPage.saveAndTest()).not.toBeOK();
  await expect(configPage).toHaveAlert('error', { hasText: 'API key is missing' });
});
```

### Testing the configuration in a frontend data source plugin

A frontend data source plugin may call any endpoint to test whether the provided configuration is valid. You can use Playwright's [`waitForResponse`](https://playwright.dev/docs/api/class-page#page-wait-for-response) method and specify the url of the endpoint that is being called.

```ts title="configurationEditor.spec.ts"
test('"Save & test" should be successful when configuration is valid', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource<JsonData, SecureJsonData>({ fileName: 'datasources.yaml' });
  const configPage = await createDataSourceConfigPage({ type: ds.type });
  await page.getByLabel('Path').fill(ds.jsonData.path);
  await page.getByLabel('API Key').fill(ds.secureJsonData.apiKey);
  const testDataSourceResponsePromise = page.waitForResponse('/api/health');
  await configPage.saveAndTest({ skipWaitForResponse: true });
  await expect(testDataSourceResponsePromise).toBeOK();
});
```

Alternatively, you can assert that a success alert box is displayed on the page.

```ts title="configurationEditor.spec.ts"
test('"Save & test" should display success alert box when config is valid', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yaml' });
  const configPage = await createDataSourceConfigPage({ type: ds.type });
  await page.getByLabel('Path').fill(ds.jsonData.path);
  await page.getByLabel('API Key').fill(ds.secureJsonData.apiKey);
  await configPage.saveAndTest({ skipWaitForResponse: true });
  await expect(configPage).toHaveAlert('success');
});
```
