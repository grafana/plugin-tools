---
id: api
title: Use the API
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

The `@grafana/plugin-e2e` package uses the [page object model](https://playwright.dev/docs/pom) pattern to simplify the authoring of tests and ease maintenance of the codebase. In the page object model, each web page of an application is represented as a class file.

## Classes

In the `@grafana/plugin-e2e` package, classes represent pages or components in Grafana. Their purpose is to encapsulate common UI operations in one place. They also handle UI deviations between different versions of Grafana.

The package exports classes, but the classes are also exposed through the Playwright API via so called [fixtures](https://playwright.dev/docs/test-fixtures).

## Fixtures

The `@grafana/plugin-e2e` package defines a set of [custom fixtures](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-e2e/src/types.ts) that facilitate the end-to-end testing of Grafana plugins.

The following section explains the different types of page fixtures:

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

To start a test with a page object model that points to an aready existing resource, use any of the fixtures prefixed with `goto`.

The following example uses the `gotoAnnotationEditPage` fixture to resolve an `AnnotationEditPage` model. Invoking this fixture will navigate to the edit form for an existing annotation in an existing dashboard.

```ts
test('test annotation query', async ({ gotoAnnotationEditPage }) => {
  const annotationEditPage = await gotoAnnotationEditPage({ dashboard: { uid: 'trlxrdZVk' }, id: '1' });
  await expect(annotationEditPage.runQuery()).toBeOK();
});
```

To learn how to provision the Grafana instance with the resources that you need, refer to the [Set up resources](./setup-resources.md) guide.

## Expect matchers

The Playwright API allows you to extend the default assertions by providing custom matchers. `@grafana/plugin-e2e` defines a set of custom matchers that simplify assertions for certain pages. To see the full list of matchers, refer to the Github [repository](https://github.com/grafana/plugin-tools/tree/main/packages/plugin-e2e/src/matchers).
