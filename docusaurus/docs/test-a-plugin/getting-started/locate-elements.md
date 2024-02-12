---
id: locate-elements
title: Locating elements
description: How to locate elements on the page
draft: true
keywords:
  - grafana
  - plugins
  - plugin
  - e2e
  - example test
sidebar_position: 3
---

# Locating elements

Ever since Grafana 7.0.0, end-to-end tests in Grafana have been relying on selectors defined in the [`@grafana/e2e-selectors`](https://github.com/grafana/grafana/tree/main/packages/grafana-e2e-selectors) package to locate elements in the Grafana UI. In the beginning, the selectors were using the `aria-label` attribute, but now most selectors have been migrated to use the `data-testid` attribute instead.

Whenever you want to interact with an element from the Grafana UI, you should always use the `getByTestIdOrAriaLabel` method and pass it a Grafana selector defined in the `selectors` fixture.

# Locating Grafana UI elements

Locating Grafana UI elements can be challenging as their selector may use either `aria-label` attribute or `data-testid` attribute. All pages defined by `@grafana/plugin-e2e` expose a `getByTestIdOrAriaLabel` method that will locate elements using the right html attribute. Whenever you want to resolve a Playwright locator based on a Grafana UI selector, you should always use this method.

```ts
panelEditPage.getByTestIdOrAriaLabel(selectors.components.CodeEditor.container).click();
```

## The `selectors` fixture

Selectors defined in the `@grafana/e2e-selectors` package are tied to a specific Grafana version. This means that they can change from one version to another. When a new e2e test sessions is started, `@grafana/plugin-e2e` checks what version of Grafana is under test and resolves selectors that are associated with the current version. The selectors are provided through the `selectors` fixture.

```typescript
import { test, expect } from '@grafana/plugin-e2e';

test('annotation query should be OK when query is valid', async ({ panelEditPage, page, selectors }) => {
  await annotationEditPage.datasource.set('E2E Test Data Source');
  await annotationEditPage
    .getByTestIdOrAriaLabel(selectors.components.CodeEditor.container)
    .fill('SELECT * FROM users');
  await expect(annotationEditPage.runQuery()).toBeOK();
});
```
