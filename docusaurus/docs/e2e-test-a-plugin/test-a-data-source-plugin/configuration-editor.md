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
sidebar_position: 10
---

## Introduction

This guide provides examples on how to test the configuration editor and the health check for backend and frontend Data Source plugins.

### Testing the configuration editor

In the following example, we're testing that a field is being displayed only in case a certain checkbox is checked.

```ts
test('should display custom field when `Show custom field` radio button is clicked ', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = readProvisionedDataSource<JsonData, SecureJsonData>({ fileName: 'datasources.yaml' });
  await createDataSourceConfigPage({ type: ds.type });
  await expect(page.getByPlaceholder('Custom field')).not.toBeVisible();
  await page.getByLabel('Show custom field').check();
  await expect(page.getByPlaceholder('Custom field')).toBeVisible();
});
```

### Testing the configuration in a backend Data Source plugin

In the next example, the configuration of a backend Data Source plugin is tested. The configuration editor form is populated with valid configuration values, and then the `Save & test` button is clicked. Clicking `Save & test` calls Grafana backend to save the configuration and then passes configuration to the plugin's backend health check endpoint. The test will be successful only if both calls yields a successful status code.

```ts
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

### Testing the configuration in a frontend Data Source plugin

A frontend Data Source plugin may call any endpoint to test whether the provided configuration is valid. You can use Playwright's [`waitForResponse`](https://playwright.dev/docs/api/class-page#page-wait-for-response) method and specify the url of the endpoint that is being called.

```ts
test('"Save & test" should be successful when configuration is valid', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = readProvisionedDataSource<JsonData, SecureJsonData>({ fileName: 'datasources.yaml' });
  const configPage = await createDataSourceConfigPage({ type: ds.type });
  await page.getByLabel('Path').fill(ds.jsonData.path);
  await page.getByLabel('API Key').fill(ds.secureJsonData.apiKey);
  const testDataSourceResponsePromise = page.waitForResponse('/api/health');
  await configPage.saveAndTest({ skipWaitForResponse: true });
  await expect(testDataSourceResponsePromise).toBeOK();
});
```

Alternatively, you can assert that a success alert box is displayed on the page.

```ts
test('"Save & test" should display success alert box when config is valid', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = readProvisionedDataSource({ fileName: 'datasources.yaml' });
  const configPage = await createDataSourceConfigPage({ type: ds.type });
  await page.getByLabel('Path').fill(ds.jsonData.path);
  await page.getByLabel('API Key').fill(ds.secureJsonData.apiKey);
  await configPage.saveAndTest({ skipWaitForResponse: true });
  await expect(configPage).toHaveAlert('success');
});
```
