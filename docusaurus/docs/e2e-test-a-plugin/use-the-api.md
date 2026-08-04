---
id: api
title: Use the API
description: How to use the grafana/plugin-e2e API.
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

The following sections explain the different types of fixtures:

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

### Components

Component model objects represent Grafana UI components such as the `select`, `switch`, `radio group`, and `color picker` components. Like pages, they encapsulate common UI operations in one place and handle UI deviations between different versions of Grafana. Use the `components` fixture to interact with a Grafana UI component instead of writing your own locators.

The following example uses the `dataSourcePicker` component to select a data source:

```ts
test('set data source in data source picker', async ({ components }) => {
  await components.dataSourcePicker.set('gdev-prometheus');
});
```

The `components` fixture exposes the following components:

| Component                     | Primary methods                                             |
| ----------------------------- | ----------------------------------------------------------- |
| `components.dataSourcePicker` | `set(name)`                                                 |
| `components.timeRangePicker`  | `set({ from, to, zone })`                                   |
| `components.select`           | `selectOption(value)`                                       |
| `components.multiSelect`      | `selectOptions([values])`                                   |
| `components.switch`           | `check()`, `uncheck()`                                      |
| `components.radioGroup`       | `check(labelOrValue)`                                       |
| `components.unitPicker`       | `selectOption(path)` where `path` is like `'Misc > Pixels'` |
| `components.colorPicker`      | `selectOption(rgbOrHex)`                                    |

To see the full list of components exposed by `@grafana/plugin-e2e`, refer to the Github [repository](https://github.com/grafana/plugin-tools/tree/main/packages/plugin-e2e/src/models/components).

#### Scope a component to a part of the page

By default, a component model resolves to the first matching element on the page. If the page contains more than one instance of a component, use the `within` method to scope the component to a Playwright [locator](https://playwright.dev/docs/locators).

The following example scopes the `select` component to the timezone field in the panel editor options pane:

```ts
test('select timezone in panel options', async ({ gotoPanelEditPage, components, selectors }) => {
  const panelEditPage = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const timezoneField = panelEditPage.getByGrafanaSelector(
    selectors.components.PanelEditor.OptionsPane.fieldLabel('Timezone Timezone')
  );
  await components.select.within(timezoneField).selectOption('Europe/Stockholm');
  await expect(components.select.within(timezoneField)).toHaveSelected('Europe/Stockholm');
});
```

## Expect matchers

The Playwright API allows you to extend the default assertions by providing custom matchers. `@grafana/plugin-e2e` defines a set of custom matchers that simplify assertions for certain pages and components. For example, the `toHaveSelected` matcher asserts that a select component has a given option selected, and the `toBeChecked` matcher asserts the state of a switch:

```ts
await expect(components.select.within(timezoneField)).toHaveSelected('Europe/Stockholm');
await expect(components.switch.within(monospaceField)).toBeChecked();
await expect(components.radioGroup.within(modeField)).toHaveChecked('Countdown');
await expect(components.colorPicker.within(backgroundField)).toHaveColor('#73bf69');
```

:::note

Grafana normalizes colors to lowercase hexadecimal values, so always pass a lowercase hexadecimal value to the `toHaveColor` matcher.

:::

To see the full list of matchers, refer to the Github [repository](https://github.com/grafana/plugin-tools/tree/main/packages/plugin-e2e/src/matchers).
