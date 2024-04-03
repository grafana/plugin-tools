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
sidebar_position: 50
---

## Introduction

Panel plugins allows you to visualize data in different ways. You can use `@grafana/plugin-e2e` to test that your panel plugin renders data correctly across multiple versions of Grafana.

### Test data

To be able to test your panel plugin, you'll need to feed it with test data. Grafana ships with the [TestData](https://grafana.com/docs/grafana/latest/datasources/testdata/) data source, which can be used to simulate [Data Frames](../../introduction/data-frames.md) formatted as time series, logs, traces, annotations and much more. To write end-to-end tests similar to the ones in this guide, you'll need the TestData data source to be configured using provisioning. If you haven't already checked out our guide on how to [setup the resources](../setup-resources.md) you'll need, do that first.

### Testing custom panel options

The Table panel has defined a custom panel option called `Show table header`. This option is enabled by default. If the switch is unchecked, the Table panel should remove headers from the table. The following test verifies that field names (headers) are displayed by default, and that they are removed when `Show table header` option is unchecked.

```ts
test('should hide headers when "Show table header" is unchecked', async ({ panelEditPage, selectors }) => {
  await panelEditPage.datasource.set('gdev-testdata');
  await panelEditPage.setVisualization('Table');
  await expect(await panelEditPage.panel.fieldNames.count()).toBeGreaterThan(0);
  const showTableHeaderSwitch = panelEditPage
    .getByTestIdOrAriaLabel(selectors.components.PanelEditor.OptionsPane.fieldLabel('Table Show table header'))
    .getByLabel('Toggle switch');
  await panelEditPage.collapseSection('Table');
  await showTableHeaderSwitch.uncheck();
  await expect(panelEditPage.panel.fieldNames).not.toBeVisible();
});
```

### Testing how the panel handles different kinds and format

The Data Frame model is very flexible. This is by design and the purpose is to allow Data Sources to return query responses in according to a whole variety of different schemas. You can find more information about the Data Frame specification [here](https://grafana.com/developers/dataplane/).

Not all panels need to support every Data Frame `data type`. However, if your panel is supposed to support a certain `data type`, it's recommended to write end-to-end tests that verifies that it's working as expected.

#### The "No Data" scenario

If a Data Source retuns [`No Data`](https://grafana.com/developers/dataplane/#no-data-and-empty), it's good practice to somehow indicate that to the users.

In the following snippet, we test how the Table panel handles the `No Data` scenario.

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

#### The