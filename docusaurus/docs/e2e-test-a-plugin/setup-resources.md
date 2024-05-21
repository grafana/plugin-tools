---
id: setup-resources
title: Configure necessary resources
description: Configure any dashboards, data sources or other Grafana resources necessary for end-to-end testing your plugin, through provisioning.
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

## Introduction

In many cases, you'll need certain resources to be configured in Grafana before you can run your end-to-end tests. For example, to test how a panel plugin displays data, you'll need a data source configured to query and return that data. This guide covers how to set up these resources through [provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/).

## Test isolation

[Test isolation](https://playwright.dev/docs/browser-contexts#what-is-test-isolation) is a central part of Playwright testing. On this subject, we recommend testing plugin features independently as oppose to running them through advanced flows where certain steps have dependencies to the previous steps.

### A concrete example

Let's say you want to test template variable interpolation in your data source plugin. For any interpolation to take place in the `DataSource` file, there needs to be a template variable defined. Since the goal is to test variable interpolation, we don't want to create the template variable within the test code. Instead, we will use a provisioned dashboard that has a template variable already defined in our test.

In the following example, we navigate to a provisioned dashboard. The dashboard has a multi-valued template variable `env` with the values `test` and `prod`. We add a new panel and set a SQL query that refers to the `env` variable. We then spy on the query data request, asserting that it was called with the expanded values associated with the template variable.

```ts
test('should expand multi-valued variable before calling backend', async ({
  gotoDashboardPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'variable.json' });
  const dashboardPage = await gotoDashboardPage(dashboard);
  const panelEditPage = await dashboardPage.addPanel();
  const queryDataSpy = panelEditPage.waitForQueryDataRequest((request) =>
    (request.postData() ?? '').includes(`select * from dataset where env in ('test', 'prod')"`)
  );
  await page.getByLabel('Query').fill('select * from dataset where env in (${env:singlequote})');
  await panelEditPage.refreshPanel();
  await expect(await queryDataSpy).toBeTruthy();
});
```

## Provision necessary resources

You can use [provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/) to configure resources such as dashboards and data sources.

:::note

If running end-to-end tests in CI requires provisioning, you may need to remove the `provisioning` folder from your plugin's `.gitignore` file.

:::

:::danger

Be careful not to commit secrets to public repositories. Use [environment variable interpolation](https://grafana.com/docs/grafana/latest/administration/provisioning/#using-environment-variables) for sensitive data.

:::

## Read provisioned files

The `@grafana/plugin-e2e` tool provides fixtures that enables you to read files that you have placed in the `provisioning` folder.

### readProvisionedDataSource fixture

The `readProvisionedDataSource` fixture allows you to read a file from your plugin's `provisioning/datasources` folder. This gives you typings and it also allows you to keep data source configuration in one place.

```ts title="configEditor.spec.ts"
const datasource = readProvisionedDataSource<JsonData, SecureJsonData>({ fileName: 'datasources.yml' });
await page.getByLabel('API Key').fill(datasource.secureJsonData.apiKey);
```

```ts title="queryEditor.spec.ts"
const datasource = readProvisionedDataSource({ fileName: 'datasources.yml' });
await panelEditPage.datasource.set(datasource.name);
```

### readProvisionedDashboard fixture

The `readProvisionedDashboard` fixture allows you to read the content of a dashboard JSON file from your `provisioning/dashboards` folder. It can be useful when navigating to a provisioned dashboard when you don't want to hard code the dashboard UID.

```ts title="variableEditPage.spec.ts"
const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
const variableEditPage = new VariableEditPage(
  { request, page, selectors, grafanaVersion, testInfo },
  { dashboard, id: '2' }
);
await variableEditPage.goto();
```

### readProvisionedAlertRule fixture

The `readProvisionedAlertRule` fixture allows you to read a file from your plugin's `provisioning/alerting` folder.

```ts title="alerting.spec.ts"
test('should evaluate to true when loading a provisioned query that is valid', async ({
  gotoAlertRuleEditPage,
  readProvisionedAlertRule,
}) => {
  const alertRule = await readProvisionedAlertRule({ fileName: 'alerts.yml' });
  const alertRuleEditPage = await gotoAlertRuleEditPage(alertRule);
  await expect(alertRuleEditPage.evaluate()).toBeOK();
});
```
