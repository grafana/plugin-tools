---
id: test-a-panel-plugin
title: Test a panel plugin
description: How to test a panel plugin with @grafana/plugin-e2e.
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

To be able to test your panel plugin, you'll need to feed it with test data. Grafana ships with the [TestData](https://grafana.com/docs/grafana/latest/datasources/testdata/) data source, which can be used to simulate [data frames](../key-concepts/data-frames) formatted as time series, logs, traces, annotations, and more.

## Before you begin

To write end-to-end tests similar to the ones in this guide, you'll need the `TestData` data source to be configured using provisioning. If you haven't already read our guide on how to [set up resources](./setup-resources.md), then do that first.

## Test panel options

To test your panel’s behavior, we recommend [provisioning a dashboard](https://grafana.com/developers/plugin-tools/e2e-test-a-plugin/setup-resources) with multiple panels showcasing different states of your panel. This ensures your panel functions correctly across various configurations. By avoiding reliance on the Grafana panel edit UI, this approach reduces test failures caused by UI changes, making your tests more stable and reliable.

In cases where interacting with the panel edit options is necessary, we provide a set of APIs to simplify writing tests. These APIs ensure your tests will run consistently across different versions of Grafana without requiring changes.

To interact with any of the Grafana-provided option groups, use any of the following functions:

| Function Name              | Returned Option Group |
| -------------------------- | --------------------- |
| `getPanelOptions()`        | Panel options         |
| `getStandardOptions()`     | Standard options      |
| `getValueMappingOptions()` | Value mappings        |
| `getDataLinksOptions()`    | Data links            |
| `getThresholdsOptions()`   | Thresholds            |

To interact with a custom option group added by your panel, use the `getCustomOptions('name of option group')` API.

Calling any of these APIs returns an options group object, which provides APIs for interacting with the options within that group.

| Function Name           | Return Option Type |
| ----------------------- | ------------------ |
| `getRadioGroup(label)`  | `RadioGroup`       |
| `getSwitch(label)`      | `Switch`           |
| `getTextInput(label)`   | `Locator`          |
| `getNumberInput(label)` | `Locator`          |
| `getSliderInput(label)` | `Locator`          |
| `getSelect(label)`      | `Select`           |
| `getMultiSelect(label)` | `MultiSelect`      |
| `getColorPicker(label)` | `ColorPicker`      |
| `getUnitPicker(label)`  | `UnitPicker`       |

### Examples

This test ensures that when a user selects a different unit from the standard options, the displayed unit updates correctly in the UI.

```ts
test('should change the unit when standard option is changed', async ({ panelEditPage }) => {
  const standardOptions = panelEditPage.getStandardOptions();
  const unitPicker = standardOptions.getUnitPicker('Unit');
  const unit = page.getByTestId('unit-container');

  await unitPicker.selectOption('Misc > Pixels');

  await expect(unit).toContainText('px');
});
```

This test verifies that selecting a different time zone in the panel's settings updates the displayed time zone in the clock panel.

```ts
test('should change time zone when option is selected', async ({ panelEditPage, page }) => {
  const timeFormatOptions = panelEditPage.getCustomOptions('Timezone');
  const timeZoneSelect = timeFormatOptions.getSelect('Timezone');
  const timeZone = page.getByTestId('clock-panel').getByTestId('time-zone');

  await timeZoneSelect.selectOption('Europe/Stockholm');
  await expect(timeZone).toContainText('Europe/Stockholm');
});
```

This test verifies that enabling the monospace font option in the Clock panel correctly updates the panel's font family to "monospace".

```ts
test('should change the font family when enabling monospace', async ({ panelEditPage, page }) => {
  const clockOptions = panelEditPage.getCustomOptions('Clock');
  const monospaceFont = clockOptions.getSwitch('Font monospace');
  const panel = page.getByTestId('clock-panel');

  await monospaceFont.check();
  await expect(panel).toHaveCSS('font-family', 'monospace');
});
```

This test ensures that when the "Countdown" mode is selected in the clock panel's options, the clock is running in countdown mode.

```ts
test('should count down time when option is selected', async ({ panelEditPage, page }) => {
  const clockOptions = panelEditPage.getCustomOptions('Clock');
  const clockMode = clockOptions.getRadioGroup('Mode');
  const panel = page.getByTestId('clock-panel-countdown');

  await clockMode.check('Countdown');
  await expect(panel).toBeVisible();
});
```

This test verifies that the background color of a panel changes when a new color is selected from the color picker in the panel's options.

```ts
test('should update background color based on selected option', async ({ panelEditPage, page }) => {
  const color = { hex: '#73bf69', rgb: 'rgb(115, 191, 105)' };
  const clockOptions = panelEditPage.getCustomOptions('Clock');
  const backgroundColor = clockOptions.getColorPicker('Background color');
  const panel = page.getByTestId('clock-panel');

  await backgroundColor.selectOption(color.hex);
  await expect(panel).toHaveCSS('background-color', color.rgb);
});
```

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

The data frame model is flexible by design. The purpose is to allow data sources to return query responses according to a whole variety of different [_data types_](https://grafana.com/developers/dataplane/contract-spec#available-data-types). A data type definition or declaration in Grafana's framework includes both a kind and format.

A panel doesn't have to support every data type. However, if your panel is supposed to support a certain data type, we recommend that you write end-to-end tests that verifiy that it's working as expected.

### The "No Data" scenario

If a data source returns [`No Data`](https://grafana.com/developers/dataplane/contract-spec#no-data-response), then it's good practice to indicate that to users. In the following snippet, we test how the Table panel handles the `No Data` scenario:

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
