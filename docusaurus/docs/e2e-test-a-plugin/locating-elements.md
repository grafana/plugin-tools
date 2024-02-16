---
id: locating-elements
title: Locating elements for E2E tests
description: How to locate elements on the page
draft: true
keywords:
  - grafana
  - plugins
  - plugin
  - e2e
  - example test
sidebar_position: 30
---

# Locating elements for E2E tests

Since Grafana 7.0.0, end-to-end tests in Grafana have relied on selectors defined in the [`@grafana/e2e-selectors`](https://github.com/grafana/grafana/tree/main/packages/grafana-e2e-selectors) package to locate elements in the Grafana UI. 

Locating Grafana UI elements can be challenging because the selector may be defined on either the `aria-label` attribute or the `data-testid` attribute. In the beginning, the selectors used the `aria-label` attribute, but now most selectors have been migrated to use the `data-testid` attribute instead.

# Locating Grafana UI elements

All pages defined by `@grafana/plugin-e2e` expose a `getByTestIdOrAriaLabel` method that returns a Playwright locator that resolves to element(s) selected using the right HTML attribute. Whenever you want to resolve a Playwright locator based on a Grafana UI selector, you should always use this method.

```ts
panelEditPage.getByTestIdOrAriaLabel(selectors.components.CodeEditor.container).click();
```

## The `selectors` fixture

Selectors defined in the `@grafana/e2e-selectors` package are tied to a specific Grafana version. This means that the selectors can change from one version to another. When a new E2E test session is started, `@grafana/plugin-e2e` checks what version of Grafana is under test and resolves selectors that are associated with the current version. The selectors are provided through the `selectors` fixture.

```ts
import { test, expect } from '@grafana/plugin-e2e';

test('annotation query should be OK when query is valid', async ({ panelEditPage, page, selectors }) => {
  await annotationEditPage.datasource.set('E2E Test Data Source');
  await annotationEditPage
    .getByTestIdOrAriaLabel(selectors.components.CodeEditor.container)
    .fill('SELECT * FROM users');
  await expect(annotationEditPage.runQuery()).toBeOK();
});
```
