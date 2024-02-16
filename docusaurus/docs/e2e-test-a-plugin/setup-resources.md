---
id: setup-resources
title: Configure the resources you need
description: Configure any dashboards, data sources or other Grafana resources necessary for e2e testing your plugin, through provisioning.
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - end-to-end
  - data-source
  - preparation
  - provisioning
sidebar_position: 60
---

# Introduction

In many cases, you'll need certain resources to be configured in Grafana before you can run your end-to-end tests. This guide covers how to setup the resources that you need.

## Test isolation

[Test isolation](https://playwright.dev/docs/browser-contexts#what-is-test-isolation) is a central part of Playwright testing. On this subject, we recommend testing plugin features independently and not run through advanced flows where certain steps have dependencies to the previous steps.

### A concrete example

Let's say you want to test template variable interpolation in your data source plugin. For any interpolation to take place in the DataSource file, there needs to be a template variable defined. Since the goal is to test variable interpolation, we don't want to create the template variable within the test code. A better approach is to open a provisioned dashboard that has a template variable defined already and use that in our test.

In the following example, we navigate to a provisioned dashboard. The dashboard has a multi-valued template variable `env` with the values `test` and `prod`. We add a new panel and set a SQL query that refers to the `env` variable. We then spy on the query data request, asserting that it was called with the expanded values associated with the template variable.

```ts
test('should expand multi-valued variable before calling backend', async ({
  readProvision,
  request,
  page,
  selectors,
  grafanaVersion,
}) => {
  const dashboard = await readProvisionDashboard({ fileName: 'variable.json' });
  const dashboardPage = new DashboardPage({ request, page, selectors, grafanaVersion }, dashboard);
  await dashboardPage.goto();
  const panelEditPage = await dashboardPage.addPanel();
  const queryDataSpy = panelEditPage.waitForQueryDataRequest((request) =>
    (request.postData() ?? '').includes(`select * from dataset where env in ('test', 'prod')"`)
  );
  await page.getByLabel('Query').fill('select * from dataset where env in (${env:singlequote})');
  await panelEditPage.refreshPanel();
  await expect(await queryDataSpy).toBeTruthy();
});
```

## Provision any required resources

You may use [provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/) to configure resources such as dashboards and data sources.

> If running end-to-end tests in CI requires provisioning, you may need to remove the `provisioning` folder from your plugin's `.gitignore` file. Be careful not to commit secrets to public repositories. Use [environment variable](https://grafana.com/docs/grafana/latest/administration/provisioning/#using-environment-variables) interpolation for sensitive data.

## Read provisioned files

`@grafana/plugin-e2e` provides fixtures that enables you to read files that you have placed in the `provisioning` folder.

### `readProvisionedDataSource` fixture

The `readProvisionedDataSource` fixture allows you to read a file from your plugin's `provisioning/datasources` folder. This gives you typings and it also allows you to keep sensitive data in one place.

```ts title="configEditor.spec.ts"
const datasource = readProvisionedDataSource<JsonData, SecureJsonData>({ fileName: 'datasources.yaml' });
await page.getByLabel('API Key').fill(datasource.secureJsonData.apiKey);
```

```ts title="queryEditor.spec.ts"
const datasource = readProvisionedDataSource({ fileName: 'datasources.yaml' });
await panelEditPage.datasource.set(datasource.name);
```

### `readProvisionedDashboard` fixture

The `readProvisionedDashboard` fixture allows you to read the content of a dashboard json file. It can be useful when navigating to a provisioned dashboard and you don't want to hard code the dashboard UID.

```ts title="variableEditPage.spec.ts"
const dashboard = await readProvisionedDashboard({ fileName: 'demo.json' });
const variableEditPage = new VariableEditPage({ request, page, selectors, grafanaVersion }, { dashboard, id: '2' });
await variableEditPage.goto();
```
