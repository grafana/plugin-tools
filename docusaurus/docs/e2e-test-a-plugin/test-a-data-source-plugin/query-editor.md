---
id: query-editor
title: Test the query editor
description: How to test the query editor
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

The query editor is a central piece of a data source plugin as this is where the query that is used to fetch data is being crafted. Some data source plugins provide rich query editors with various query types targeting different APIs. They can have visual query builders and/or code editors with support for advanced features such as intellisense and autocompletion.

### Testing parts of the query editor in isolation

The query editor in the following example loads regions via a request to the `/regions` and filters out regions containing `gov` before presenting them in a dropdown.

The [`<page>.mockResourceResponse`](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-e2e/src/models/pages/GrafanaPage.ts#L53) method allows you to mock the response of a request to the data source [resource API](https://grafana.com/developers/plugin-tools/introduction/backend-plugins#resources). To test that the filtering is working as expected, we use this method to mock the `/regions` response and assert that only the regions without `-gov-` in their name are shown when the regions dropdown is clicked.

```ts title="queryEditor.spec.ts"
test('should filter out govcloud regions', async ({ panelEditPage, selectors, readProvisionedDataSource }) => {
  const regionsMock = ['us-gov-west-1', 'us-east-1', 'us-west-1', 'us-gov-east-1'];
  const expectedRegions = ['us-east-1', 'us-west-1'];
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yaml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.mockResourceResponse('regions', regionsMock);
  await panelEditPage.getQueryEditorRow('A').getByText('Regions').click();
  await expect(panelEditPage.getByTestIdOrAriaLabel(selectors.components.Select.option)).toHaveText(expectedRegions);
});
```

### Testing the entire data flow

In the next example, we're doing an integration test where the entire data flow of the plugin is tested.

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

### Panel data assertion

In many cases, asserting that the data query response is OK won't be enough to say your data source plugin is functioning properly - you also need to assert on the data that is shown in the panel. Grafana comes with a set of built-in panels, and there's a whole variety of community panels available in the [Plugin catalog](https://grafana.com/grafana/plugins/). All panels can render data differently, so it's impossible to provide a consitent way to assert on the displayed data across all panels. It's therefore recommended to use the `Table` panel for this. The `<page>.panel.data` property returns a [Playwright locator](https://playwright.dev/docs/locators) that resolves element(s) that contain the value(s) that are currently displayed in the Table panel. This means you can use any auto-retrying [matcher](https://playwright.dev/docs/test-assertions#auto-retrying-assertions) that accepts a locator as the receiving type.

```ts title="queryEditor.spec.ts"
test('data query should return values 1 and 3', async ({ panelEditPage, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.setVisualization('Table');
  await expect(panelEditPage.refreshPanel()).toBeOK();
  await expect(panelEditPage.panel.data).toContainText(['1', '3']);
});
```

If you want to assert on what column headers are being displayed in the Table panel, you can use the `<page>.panel.fieldNames` property.

```ts title="queryEditor.spec.ts"
test('data query should return headers  and 3', async ({ panelEditPage, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.setVisualization('Table');
  await expect(panelEditPage.refreshPanel()).toBeOK();
  await expect(panelEditPage.panel.fieldNames).toHaveText(['Stockholm', 'Vienna']);
});
```
