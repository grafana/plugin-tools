---
id: data-queries
title: Test data queries
description: Testing the query editor and the execution of data queries
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - data-source
  - query editor
sidebar_position: 20
---

## Introduction

The query editor is a central piece of a data source plugin as this is where users craft the query that is used to fetch data. Your data source plugin can provide a rich query editor which allows various query types that target different APIs. Your query editor can even have features such as visual query builders, IntelliSense, and autocompletion.

### Test that the query editor loads

The following example is a simple smoke test that verifies that the data source query editor loads:

```ts title="queryEditor.spec.ts"
import { test, expect } from '@grafana/plugin-e2e';

test('should render query editor', async ({ panelEditPage, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await expect(panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});
```

### Test parts of the query editor in isolation

In the following example, the query editor loads regions via a request to `/regions` and filters out the ones containing `gov` before populating them in a dropdown menu.

The [`<page>.mockResourceResponse`](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-e2e/src/models/pages/GrafanaPage.ts#L53) method allows you to mock the response of a request to the data source [resource API](../../key-concepts/backend-plugins/#resources). To test that the filtering is working as expected, we use this method to mock the `/regions` response and assert that only the regions without `-gov-` in their name are shown when the regions dropdown is clicked.

```ts title="queryEditor.spec.ts"
test('should filter out govcloud regions', async ({ panelEditPage, selectors, readProvisionedDataSource }) => {
  const regionsMock = ['us-gov-west-1', 'us-east-1', 'us-west-1', 'us-gov-east-1'];
  const expectedRegions = ['us-east-1', 'us-west-1'];
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yaml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.mockResourceResponse('regions', regionsMock);
  await panelEditPage.getQueryEditorRow('A').getByText('Regions').click();
  await expect(panelEditPage.getByGrafanaSelector(selectors.components.Select.option)).toHaveText(expectedRegions);
});
```

### Testing the entire data flow

The following example shows an integration test that tests the entire query data flow of a plugin.

:::warning
Hitting third-party APIs in end-to-end tests can be useful, but it may also have security concerns as well as introduce flakiness to your CI pipeline. You should always think it through carefully and consider using mocks instead.
:::

```ts title="queryEditor.spec.ts"
test('data query should be successful when the query is valid', async ({
  panelEditPage,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yaml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.getQueryEditorRow('A').getByText('Query Text').fill('SELECT * FROM dataset');
  await expect(panelEditPage.refreshPanel()).toBeOK();
});
```

### Make a panel data assertion

In many cases, asserting that the data query response is OK won't be enough to say your data source plugin is functioning properly. You must also make an assertion on the data that is shown in the panel.

Grafana comes with a set of built-in panels, and there's a variety of community panels available in the [Grafana plugin catalog](https://grafana.com/grafana/plugins/). Every panel can render data differently, so it's impossible to provide a consitent way to assert on the displayed data across all panels. Therefore, we recommended that you use the `Table` panel for this.

The `<page>.panel.data` property returns a [Playwright locator](https://playwright.dev/docs/locators) that resolves one or more elements that contain the values that are currently displayed in the Table panel. This means you can use any auto-retrying [matcher](https://playwright.dev/docs/test-assertions#auto-retrying-assertions) that accepts a locator as the receiving type.

```ts title="queryEditor.spec.ts"
test('data query should return values 10 and 20', async ({ panelEditPage, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.setVisualization('Table');
  await expect(panelEditPage.refreshPanel()).toBeOK();
  await expect(panelEditPage.panel.data).toContainText(['10', '20']);
});
```

If you want to assert on what column headers are shown in the `Table` panel, you can use the `<page>.panel.fieldNames` property.

```ts title="queryEditor.spec.ts"
test('data query should return headers  and 3', async ({ panelEditPage, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.setVisualization('Table');
  await expect(panelEditPage.refreshPanel()).toBeOK();
  await expect(panelEditPage.panel.fieldNames).toHaveText(['Stockholm', 'Vienna']);
});
```

### Testing a query in a provisioned dashboard

Sometimes you may want to open the panel edit page for an already existing panel and run the query to make sure everything work as expected.

```ts
test('query in provisioned dashboard should return temp and humidity data', async ({
  readProvisionedDashboard,
  gotoPanelEditPage,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '3' });
  await expect(panelEditPage.refreshPanel()).toBeOK();
  await expect(panel.fieldNames).toContainText(['temperature', 'humidity']);
  await expect(panel.data).toContainText(['25', '10']);
});
```

You can also open an already existing dashboard and verify that a table panel have rendered the data that you expect.

```ts
test('getting panel by id', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const dashboardPage = await gotoDashboardPage(dashboard);
  const panel1 = await dashboardPage.getPanelById('3');
  await expect(panel1.data).toContainText(['25', '32', 'staging']);
  const panel2 = await dashboardPage.getPanelByTitle('Basic table example');
  await expect(dashboardPage.panel2.fieldNames).toContainText(['Tokyo', 'Berlin']);
});
```
