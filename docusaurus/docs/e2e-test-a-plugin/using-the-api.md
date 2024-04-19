---
id: using-the-api
title: Using the API
description: How to use the grafana/plugin-e2e API
keywords:
  - grafana
  - plugins
  - plugin
  - e2e
  - end-to-end
  - API
sidebar_position: 10
---

`@grafana/plugin-e2e` is using the [page object model](https://playwright.dev/docs/pom) pattern to simplify the authoring of tests and ease maintenance of the codebase. In the page object model, each web page of an application is represented as a class file.

## Classes

In the `@grafana/plugin-e2e` package, classes represent pages or components in Grafana. Their purpose is to encapsulate common UI operations in one place. They also handle UI deviations between different versions of Grafana.

Classes are exported by the package, but they're are also exposed through the Playwright API via so called [fixtures](https://playwright.dev/docs/test-fixtures).

## Fixtures

`@grafana/plugin-e2e` defines a set of [custom fixtures](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-e2e/src/types.ts/#L21-L258) that facilitates the end-to-end testing of Grafana plugins. In the following section, the different types of fixtures are being explained.

### Pages

Page model objects can represent a new instance of a page or a page for an already existing resource. To see the full list of pages exposed by `@grafana/plugin-e2e`, refer to the Github [repository](https://github.com/grafana/plugin-tools/tree/main/packages/plugin-e2e/src/models/pages).

#### Using a new, empty instance of a page type in a test

To start a test in a new, empty page of a certain type, use the camel case representation of the page object model name.

The following example uses the variable edit page. When using the `variableEditPage` fixture, the test will start with an empty variable edit form in a new dashboard.

```ts
test('test variable edit page', async ({ variableEditPage }) => {
  await variableEditPage.setVariableType('Query');
});
```

#### Using an existing resource

To start a test with a page object model pointing to an aready existing resource, use any of the fixtures prefixed with `goto`.

The following example uses the `gotoAnnotationEditPage` fixture to resolve an `AnnotationEditPage` model. Invoking this fixture will navigate to the edit form for an existing annotation in an existing dashboard.

```ts
test('test annotation query', async ({ gotoAnnotationEditPage }) => {
  const annotationEditPage = await gotoAnnotationEditPage({ dashboard: { uid: 'trlxrdZVk' }, id: '1' });
  await expect(annotationEditPage.runQuery()).toBeOK();
});
```

To learn how to provisiong the Grafana instance with the resources that you need, have a look at [this](./setup-resources.md) guide.

## Expect matchers

The Playwright API allows extending the default assertions by providing custom matchers. `@grafana/plugin-e2e` defines a set of custom matchers that simplifies assertions for certain pages. To see the full list of matchers, refer to the Github [repository](https://github.com/grafana/plugin-tools/tree/main/packages/plugin-e2e/src/matchers).

---

Every class is instatiated with information about the current test session:

- the Playwright [Page](https://playwright.dev/docs/api/class-page) class
- the Playwright [TestInfo](https://playwright.dev/docs/api/class-testinfo) class
- what Grafana version is under test
- what end-to-end selector to use for the version of Grafana that is under test

Using the this information, the operations exposed by classes in `@grafana/plugin-e2e` can be made Grafana version specific. The following example demonstrates how the `Panel.getErrorIcon` method handles deviations between different versions of Grafana.

```ts title="Panel.ts"
getErrorIcon(): Locator {
    let selector = this.ctx.selectors.components.Panels.Panel.status(ERROR_STATUS);

    // the selector (not the selector value) used to identify a panel error changed in 9.4.3
    if (semver.lte(this.ctx.grafanaVersion, '9.4.3')) {
      selector = this.ctx.selectors.components.Panels.Panel.headerCornerInfo(ERROR_STATUS);
    }

    return this.getByGrafanaSelector(selector, {
      root: this.locator,
    });
  }
```

### Components

Parts of the web application that can be seen across multiple pages are encapsulated in component classes. Example of components are `Panel`, `TimeRange` and `DataSourcePicker`.

### Pages

Every page object has a `goto` method that navigates to the resources associated with the page. If the page was instantiated with an id referring to an object stored in the Grafana database, the `goto` method will navigate to the resource. If the page was instantiated without an id, the `goto` method will navigate to a new instance of the page.

```ts title="Instantiating and navigating to a new, empty dashboard page"
const dashboardPage = new DashboardPage({ page, selectors, grafanaVersion, request, testInfo });
await dashboardPage.goto();
```

```ts title="Instantiating and navigating to an existing dashboard page"
const dashboardPage = new DashboardPage({ page, selectors, grafanaVersion, request, testInfo }, { uid: 'trlxrdZVk' });
await dashboardPage.goto();
```
