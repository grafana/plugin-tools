---
id: variable-queries
title: Test variable queries
description: Test a custom variable query editor and the execution of variable queries.
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - data-source
  - variable editor
sidebar_position: 30
---

## Introduction

[Variable queries](https://grafana.com/docs/grafana/latest/dashboards/variables/add-template-variables/#add-a-query-variable) allow users to query a data source to load lists of data such as metric names. You can then reference variables in queries to make your dashboards more interactive and dynamic. If your data source plugin implements the custom variable support API, you may want to use the `variableEditPage` fixture to test that your plugin's variable implementation works as expected.

### Test the custom variable editor

In the following example, we test that the custom variable editor renders a certain field when the `ListByDimensions` query type is chosen:

```ts title="customVariableEditor.spec.ts"
test('should display Dimensions field only if ListByDimensions is selected', async ({
  variableEditPage,
  page,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yaml' });
  await variableEditPage.setVariableType('Query');
  await variableEditPage.datasource.set(ds.name);
  const dimensionField = variableEditPage.getByGrafanaSelector('Dimensions');
  await expect(dimensionField).not.toBeVisible();
  await variableEditPage.getByLabel('Query type').fill('ListByDimensions');
  await page.keyboard.press('Enter');
  await expect(dimensionField).toBeVisible();
});
```

### Test the variable query execution flow

In the next example, we perform an integration test where we test a plugin's entire variable query data flow. For successful variable queries, the resulting options are displayed at the bottom of the variable edit page. You can use the matcher `toDisplayPreviews` to assert that the expected previews are displayed.

![](/img/variable-preview.png)

:::warning

Although calling third-party APIs in end-to-end tests can be useful, it may also introduce security concerns and other issues to your CI pipeline. You should always think it through carefully and consider using mocks instead.

:::

```ts title="customVariableEditor.spec.ts"
test('custom variable query runner should return data when query is valid', async ({
  variableEditPage,
  page,
  readProvisionedDataSource,
  selectors,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yaml' });
  await variableEditPage.setVariableType('Query');
  await variableEditPage.datasource.set(ds.name);
  const codeEditorSelector = selectors.components.CodeEditor.container;
  await variableEditPage.getByGrafanaSelector(codeEditorSelector).click();
  await page.keyboard.insertText('select distinct(environment) from dataset');
  const queryDataRequest = variableEditPage.waitForQueryDataRequest();
  await variableEditPage.runQuery();
  await queryDataRequest;
  await expect(variableEditPage).toDisplayPreviews(['test', /staging-.*/]);
});
```

:::note
Unlike the `panelEditPage.refreshPanel` method, the `variableEditPage.runQuery` method doesn't return a [Playwright response](https://playwright.dev/docs/api/class-response) promise. In the example above, the variable query goes through the data query endpoint, but you may also use Playwright's [`waitForResponse`](https://playwright.dev/docs/api/class-page#page-wait-for-response) method and specify any endpoint of choice.
:::

If you just want to test the variable query runner without testing the custom variable editor, you can use an already existing variable query from a provisioned dashboard.

```ts title="customVariableEditor.spec.ts"
test('should return data when valid query from provisioned dashboard is used', async ({
  readProvisionedDashboard,
  gotoVariableEditPage,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const variableEditPage = await gotoVariableEditPage({ dashboard, id: '2' });
  await variableEditPage.runQuery();
  await expect(variableEditPage).toDisplayPreviews(['staging', 'test']);
});
```
