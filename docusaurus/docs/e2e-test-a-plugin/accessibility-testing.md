---
id: accessibility-testing
title: Accessibility testing
description: How to test the accessibility of a plugin in end-to-end tests.
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - end-to-end
  - accessibility
  - a11y
  - axe
  - wcag
sidebar_position: 70
---

## Introduction

Grafana targets [WCAG 2.1 level AA](https://www.w3.org/TR/WCAG21/), and plugins are part of that experience. To help you meet the same bar, `@grafana/plugin-e2e` integrates with [axe](https://github.com/dequelabs/axe-core), an accessibility testing engine, through two APIs:

- **`scanForA11yViolations` fixture:** Runs an axe scan against the current page and returns the raw axe results.
- **`toHaveNoA11yViolations` matcher:** Asserts on those results, with support for thresholds and ignored rules.

Automated scans catch a meaningful subset of accessibility problems, such as missing labels, invalid ARIA attributes, and insufficient color contrast. They don't replace manual testing with a keyboard and a screen reader.

:::note

The accessibility APIs are in alpha. They may change in a minor release while we gather feedback.

:::

## Before you begin

The axe integration is an optional peer dependency, so you need to install it in your plugin:

```sh
npm install --save-dev @axe-core/playwright
```

If `@axe-core/playwright` isn't installed, the `scanForA11yViolations` fixture throws an error the first time you call it.

## Scan a full page

Call `scanForA11yViolations` without arguments to scan the whole page, then assert on the result with `toHaveNoA11yViolations`.

Wait for the content you care about before you scan. A scan that runs while Grafana is still loading only tests the loading state:

```ts
import { test, expect } from '@grafana/plugin-e2e';

test('app page has no accessibility violations', async ({ gotoAppPage, page, scanForA11yViolations }) => {
  await gotoAppPage({ path: '/', pluginId: 'myorg-myplugin-app' });
  await expect(page.getByRole('heading', { name: 'My plugin' })).toBeVisible();

  const results = await scanForA11yViolations();

  expect(results).toHaveNoA11yViolations();
});
```

Every scan is attached to the Playwright report as a JSON attachment named `axe-1`, `axe-2`, and so on, with one attachment per scan in a test. Open the report to inspect passes, incomplete results, and the full details of each violation.

## Scan part of a page

A full page scan includes the Grafana chrome that surrounds your plugin, such as the navigation menu and the dashboard controls. To assert only on the markup your plugin owns, pass `include` with a CSS selector.

Both `include` and `exclude` accept a single CSS selector or an array of them. They don't accept Playwright locators or Grafana end-to-end selectors. Grafana end-to-end selectors are values of the `data-testid` or `aria-label` attribute, so use the `resolveGrafanaSelector` helper exported by `@grafana/plugin-e2e` to turn one into a CSS selector:

```ts
import { test, expect, resolveGrafanaSelector } from '@grafana/plugin-e2e';

test('panel has no accessibility violations', async ({
  gotoDashboardPage,
  readProvisionedDashboard,
  selectors,
  scanForA11yViolations,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const dashboardPage = await gotoDashboardPage(dashboard);
  await expect(dashboardPage.getPanelByTitle('Sales by region').locator).toBeVisible();

  const results = await scanForA11yViolations({
    include: resolveGrafanaSelector(selectors.components.Panels.Panel.title('Sales by region')),
  });

  expect(results).toHaveNoA11yViolations();
});
```

To learn more about Grafana end-to-end selectors, refer to the [Select UI elements](./selecting-ui-elements.md) guide.

Use `exclude` to scan a page but skip a subtree. For example, you may need to skip a third-party component you don't control:

```ts
const results = await scanForA11yViolations({ exclude: '[data-testid="third-party-map"]' });
```

## Use the default Grafana rules

By default, a scan runs the axe rules that map to the WCAG levels Grafana targets. The package exports that tag list as `DEFAULT_A11Y_TAGS`:

```ts
import { DEFAULT_A11Y_TAGS } from '@grafana/plugin-e2e';

// ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
```

Rules outside these tags, such as the axe `best-practice` rules, aren't run. For the full list of rules behind each tag, refer to the [axe rule descriptions](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md).

## Use custom rules

Pass `options` to send [axe run options](https://www.deque.com/axe/core-documentation/api-documentation/#options-parameter) to the scan. For example, to run a single rule while you fix one class of problem:

```ts
const results = await scanForA11yViolations({ options: { runOnly: ['color-contrast'] } });

expect(results).toHaveNoA11yViolations();
```

:::warning

The `options` you pass replace the default configuration, including the WCAG tags. To keep the Grafana defaults and add configuration on top, set `runOnly` yourself with `DEFAULT_A11Y_TAGS`:

```ts
import { DEFAULT_A11Y_TAGS, test, expect } from '@grafana/plugin-e2e';

const results = await scanForA11yViolations({
  options: {
    runOnly: { type: 'tag', values: [...DEFAULT_A11Y_TAGS, 'best-practice'] },
  },
});
```

:::

## Exclude a rule

You can exclude a rule at two different points, and which one you choose depends on what you want the report to contain.

To skip a rule during the scan, disable it in `options.rules`. The rule doesn't run, so it doesn't appear in the report:

```ts
import { DEFAULT_A11Y_TAGS } from '@grafana/plugin-e2e';

const results = await scanForA11yViolations({
  options: {
    runOnly: { type: 'tag', values: DEFAULT_A11Y_TAGS },
    rules: { 'color-contrast': { enabled: false } },
  },
});

expect(results).toHaveNoA11yViolations();
```

To run a rule but not fail the test on it, pass `ignoredRules` to the matcher. The violations are still scanned and attached to the report, which makes this a good fit for known issues you plan to fix:

```ts
const results = await scanForA11yViolations();

expect(results).toHaveNoA11yViolations({ ignoredRules: ['color-contrast'] });
```

## Allow a number of violations

When you add accessibility tests to a plugin that already has known problems, a scan can fail on issues you're not ready to fix. Use `threshold` to assert that the number of violations doesn't grow past a given number:

```ts
const results = await scanForA11yViolations();

expect(results).toHaveNoA11yViolations({ threshold: 3 });
```

The assertion passes as long as the scan finds no more than `threshold` violations. Lower the number as you fix issues so that new violations keep failing the test.
