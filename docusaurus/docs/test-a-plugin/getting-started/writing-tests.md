---
id: writing-tests
title: Writing tests
description: How to write tests
keywords:
  - grafana
  - plugins
  - plugin
  - e2e
  - example test
sidebar_position: 2
---

# First test

In the following test, the panel edit page is used to test a data source plugin.

```typescript
import { test, expect } from '@grafana/plugin-e2e';

test('data query should be OK when URL is valid', async ({ panelEditPage, page }) => {
  const API_URL = 'https://jsonplaceholder.typicode.com/users';
  await panelEditPage.datasource.set('Infinity E2E');
  await page.getByTestId('infinity-query-url-input').fill(API_URL);
  await expect(panelEditPage.refreshPanel()).toBeOK();
});
```

<!-- ## Using `grafanaVersion` and `isFeatureToggleEnabled` fixtures -->'

## More @grafana/plugin-e2e specific fixtures

In the next test, we're asserting that a new instance of the Snowflake data source can be configured successfully. Notice how the fixtures `isFeatureToggleEnabled` and `grafanaVersion` allows us to customize the test code in case a certain Grafana feature toggle is enabled and for specific Grafana versions.

```typescript
import { test, expect } from '@grafana/plugin-e2e';
import * as semver from 'semver';

test('valid credentials should return a 200 status code', async ({
  createDataSourceConfigPage,
  page,
  isFeatureToggleEnabled,
  grafanaVersion,
}) => {
  const configPage = await createDataSourceConfigPage({ type: 'grafana-snowflake-datasource' });
  await configPage.getByTestIdOrAriaLabel('Data source connection URL').fill('http://localhost:9090');
  const isSecureSocksDSProxyEnabled = await isFeatureToggleEnabled('secureSocksDSProxyEnabled');
  if (isSecureSocksDSProxyEnabled && semver.gte(grafanaVersion, '10.0.0')) {
    page.getByLabel('Enabled').check();
  }
  await expect(configPage.saveAndTest()).toBeOK();
});
```

## Using Grafana E2E selectors

Ever since Grafana 7.0.0, end-to-end tests in Grafana have been relying on selectors defined in the [`@grafana/e2e-selectors`](https://github.com/grafana/grafana/tree/main/packages/grafana-e2e-selectors) package to locate elements in the Grafana UI. In the beginning, the selectors were using the `aria-label` attribute, but now most selectors have been migrated to use the `data-testid` attribute instead. All pages exposed by @grafana/plugin-e2e provide a method for resolving a locator either from `aria-label` or `data-testid`. You should always use this method when locating elements that are part of the Grafana UI.

```typescript
// the wright way
panelEditPage.getByTestIdOrAriaLabel(selectors.components.CodeEditor.container).click();
```

```typescript
// the incorrect way - (the code editor was using aria-label in Grafana <= 10.2.3)
page.getByTestId(selectors.components.CodeEditor.container).click();
```

Selectors defined in the `@grafana/e2e-selectors` package are tied to a specific Grafana version. This means that they can change from one version to another. `@grafana/plugin-e2e` has logic to cater for that, so it will resolve selectors based on the Grafana version and expose them as a fixture.

```typescript
// the wright way
panelEditPage.getByTestIdOrAriaLabel(selectors.components.PanelEditor.toggleVizPicker).click();
```

```typescript
// the incorrect way - (the value of this selector changed in Grafana 10.0.0)
page.getByTestId('toggle-viz-picker').click();
```

Finally, this is a complete test that demonstrates how the `selectors` fixture can be used to locate the code editor component inside panel options when testing the `Text` panel plugin.

```typescript
test('code editor should be displayed when `Code` is clicked', async ({ panelEditPage, page, selectors }) => {
  const { PanelEditor, CodeEditor } = selectors.components;
  await panelEditPage.setVisualization('Text');
  await panelEditPage.collapseSection('Text');
  await page.getByText('Code').check();
  const panelOptions = panelEditPage.getByTestIdOrAriaLabel(PanelEditor.OptionsPane.content);
  const codeEditor = panelEditPage.getByTestIdOrAriaLabel(CodeEditor.container, panelOptions);
  await expect(codeEditor).toBeVisible();
});
```
