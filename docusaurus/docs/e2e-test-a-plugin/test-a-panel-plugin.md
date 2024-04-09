---
id: test-a-panel-plugin
title: Test a panel plugin
description: How to test a panel plugin with @grafana/plugin-e2e
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - panel plugin
sidebar_position: 80
---

Panel plugins allow you to visualize data in different ways. This guide shows you how to use `@grafana/plugin-e2e` to test that your panel plugin renders data correctly across multiple versions of Grafana.

## Test data

To be able to test your panel plugin, you'll need to feed it with test data. Grafana ships with the [TestData](https://grafana.com/docs/grafana/latest/datasources/testdata/) data source, which can be used to simulate [data frames](../introduction/data-frames.md) formatted as time series, logs, traces, annotations, and more.

## Before you begin

To write end-to-end tests similar to the ones in this guide, you'll need the `TestData` data source to be configured using provisioning. If you haven't already read our guide on how to [set up resources](./setup-resources.md), then do that first.

## Test panel options

The Table panel defines a custom panel option called `Show table header` by default. If the switch is disabled, the Table panel should remove headers from the table.

The following test verifies that field names (headers) are displayed by default, and that they are removed when the `Show table header` option is not selected:

```ts
test('should hide headers when "Show table header" is unchecked', async ({ panelEditPage, selectors }) => {
  await panelEditPage.datasource.set('gdev-testdata');
  await panelEditPage.setVisualization('Table');
  await expect(await panelEditPage.panel.fieldNames.count()).toBeGreaterThan(0);
  const showTableHeaderSwitch = panelEditPage
    .getByGrafanaSelector(selectors.components.PanelEditor.OptionsPane.fieldLabel('Table Show table header'))
    .getByLabel('Toggle switch');
  await panelEditPage.collapseSection('Table');
  await showTableHeaderSwitch.uncheck();
  await expect(panelEditPage.panel.fieldNames).not.toBeVisible();
});
```

## Test how the panel handles different data types

The data frame model is flexible by design. The purpose is to allow data sources to return query responses according to a whole variety of different [_data types_](https://grafana.com/developers/dataplane/#kinds-and-formats). A data type definition or declaration in Grafana's framework includes both a kind and format.

A panel doesn't have to support every data type. However, if your panel is supposed to support a certain data type, we recommend that you write end-to-end tests that verifiy that it's working as expected.

### The "No Data" scenario

If a data source returns [`No Data`](https://grafana.com/developers/dataplane/#no-data-and-empty), then it's good practice to indicate that to users. In the following snippet, we test how the Table panel handles the `No Data` scenario:

```ts
test('should display "No data" in case no data response was passed to the panel', async ({ panelEditPage, page }) => {
  await panelEditPage.datasource.set('gdev-testdata');
  await panelEditPage.setVisualization('Table');
  await page.getByLabel('Scenario').last().click();
  await page.getByText('No Data Points').click();
  await panelEditPage.refreshPanel();
  await expect(panelEditPage.panel.locator).toContainText('No data');
});
```

#### Multiple frames

The Table panel can only display one frame at the time. If more than one frame is passed to the panel, originating from the same query or from different queries, the panel only displays the first frame.

Additionally, there will also be a dropdown menu in the panel which allow the user to switch between the different frames. This behavior is specific to the Table panel.

The following snippet tests that the plugin displays the dropdown menu with two values in case two frames are being passed to the panel:

```ts
test('should display dropdown with two values when two frames are passed to the panel', async ({
  panelEditPage,
  page,
  selectors,
}) => {
  await panelEditPage.datasource.set('gdev-testdata');
  await panelEditPage.setVisualization('Table');
  await panelEditPage.getQueryEditorRow('A').getByLabel('Alias').fill('a');
  await page.getByText('Add query').click();
  await panelEditPage.getQueryEditorRow('B').getByLabel('Alias').fill('b');
  await panelEditPage.refreshPanel();
  await panelEditPage.panel.locator.getByRole('combobox').click();
  await expect(panelEditPage.getByTestIdOrAriaLabel(selectors.components.Select.option)).toHaveText(['a', 'b']);
});
```
