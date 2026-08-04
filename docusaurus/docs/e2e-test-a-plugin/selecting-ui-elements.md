---
id: selecting-elements
title: Select UI elements
description: How to select UI elements on the page in end-to-end testing.
keywords:
  - grafana
  - plugins
  - plugin
  - e2e
  - end-to-end
  - example test
sidebar_position: 20
---

# Select UI elements

This guide explains the role of selectors in Grafana end-to-end testing and how to use them to safely interact with UI elements across multiple versions of Grafana.

## Grafana end-to-end selectors

Since Grafana 7.0.0, end-to-end tests in Grafana have relied on selectors defined in the [`@grafana/e2e-selectors`](https://github.com/grafana/grafana/tree/main/packages/grafana-e2e-selectors) package to select elements in the Grafana UI.

Selecting Grafana UI elements can be challenging because the selector may be defined on either the `aria-label` attribute or the `data-testid` attribute. In the beginning, the selectors used the `aria-label` attribute, but now most selectors have been migrated to use the `data-testid` attribute instead.

## Playwright locator for Grafana UI elements

All [pages](https://github.com/grafana/plugin-tools/tree/main/packages/plugin-e2e/src/models/pages) defined by `@grafana/plugin-e2e` expose a `getByGrafanaSelector` method. This method returns a Playwright [locator](https://playwright.dev/docs/locators) that resolves to one or more elements, using the appropriate HTML attribute as defined on the element. Whenever you want to resolve a Playwright locator based on a [grafana/e2e-selectors](https://github.com/grafana/grafana/tree/main/packages/grafana-e2e-selectors), you should always use this method.

```ts
panelEditPage.getByGrafanaSelector(selectors.components.CodeEditor.container).click();
```

## The selectors fixture

Selectors defined in the `@grafana/e2e-selectors` package are tied to a specific Grafana version. This means that the selectors can change from one version to another, making it hard to use the selectors defined in `@grafana/e2e-selectors` when writing tests that target multiple versions of Grafana.

To overcome this issue, `@grafana/plugin-e2e` has its own copy of end-to-end selectors. These selectors are a subset of the selectors defined in `@grafana/e2e-selectors`, and each selector value has defined a minimum Grafana version. When you start a new end-to-end test session, `@grafana/plugin-e2e` checks what version of Grafana is under test and resolves the selectors that are associated with the running version. The selectors are provided through the `selectors` fixture.

```ts
import { test, expect } from '@grafana/plugin-e2e';

test('annotation query should be OK when query is valid', async ({ annotationEditPage, page, selectors }) => {
  await annotationEditPage.datasource.set('E2E Test Data Source');
  await annotationEditPage.getByGrafanaSelector(selectors.components.CodeEditor.container).fill('SELECT * FROM users');
  await expect(annotationEditPage.runQuery()).toBeOK();
});
```

## Interact with UI elements defined in the plugin code

As stated above, you should always use the `getByGrafanaSelector` method when the UI element you want to interact with has an associated end-to-end selector. However, many Grafana UI elements don't have end-to-end selectors. If that's the case, we recommended following Grafana's best practices for [testing](https://github.com/grafana/grafana/blob/401265522e584e4e71a1d92d5af311564b1ec33e/contribute/style-guides/testing.md) and the [testing with accessibility in mind](https://github.com/grafana/grafana/blob/401265522e584e4e71a1d92d5af311564b1ec33e/contribute/style-guides/accessibility.md#writing-tests-with-accessibility-in-mind) guide when composing your UI and writing tests.

### Scope locators

To make your tests more robust, it's good to scoop locators to your plugin context. The following example may work, but it's brittle as it will no longer work if another element with the text `URL` is added to the page somewhere outside of your plugin.

```ts
page.getByText('URL').click();
```

There are many ways to scope selectors. You can wrap the component in a div with an `data-testid` and use the ID when accessing the element.

```ts
page.getByTestId('plugin-url-wrapper').getByText('URL').click();
```

If you're testing a data source query editor, you can scope the locator to the the query editor row.

```ts
explorePage.getQueryEditorRow('A').getByLabel('Query').fill('sum(*)');
```

### Form element examples

Here are some examples demonstrating how to interact with a few UI components that are common in plugins. The `InlineField` and `Field` component can be used interchangeably.

For many common Grafana UI components, such as `select`, `switch`, `radio group`, or `color picker`, `@grafana/plugin-e2e` provides ready-made component models through the [`components` fixture](./use-the-api.md#components). When it covers the component you're testing, use the `components` fixture, since it handles UI differences between Grafana versions and other elements and the component you're targeting.

#### Input field

You can use the `InlineField` component to interact with the UI.

```tsx title="UI component"
<InlineField label="Auth key">
  <Input value={value} onChange={handleOnChange} id="config-auth-key" />
</InlineField>
```

```ts title="Playwright test"
await page.getByRole('textbox', { name: 'Auth key' }).fill('..');
```

#### Select field

Unlike many other components that require you to pass an `id` prop to be able to associate the label with the form element, the `select` component requires you to pass an `inputId` prop. You can find more information about testing the `select` component [here](https://github.com/grafana/grafana/blob/401265522e584e4e71a1d92d5af311564b1ec33e/contribute/style-guides/testing.md#testing-select-components).

```tsx title="UI component"
<div data-testid="config-auth-type-field">
  <InlineField label="Auth type">
    <Select inputId="config-auth-type" value={value} options={options} onChange={handleOnChange} />
  </InlineField>
</div>
```

Use the `select` model from the [`components` fixture](./use-the-api.md#components) to interact with the component, and the `toHaveSelected` matcher to assert the selected option:

```ts title="Playwright test"
test('testing select component', async ({ page, components }) => {
  const authTypeField = page.getByTestId('config-auth-type-field');
  await components.select.within(authTypeField).selectOption('OAuth');
  await expect(components.select.within(authTypeField)).toHaveSelected('OAuth');
});
```

#### Checkbox field

You can use the `Checkbox` component to interact with the UI.

```tsx title="UI component"
<InlineField label="TLS Enabled">
  <Checkbox id="config-tls-enabled" value={value} onChange={handleOnChange} />
</InlineField>
```

In the `Checkbox` component, the input element isn't clickable, so you need to bypass the Playwright actionability check by setting `force: true`.

```ts title="Playwright test"
await page.getByRole('checkbox', { name: 'TLS Enabled' }).uncheck({ force: true });
await expect(page.getByRole('checkbox', { name: 'TLS Enabled' })).not.toBeChecked();
```

#### InlineSwitch field

You can use the `InlineSwitch` component to interact with the UI.

```tsx title="UI component"
<div data-testid="config-tls-field">
  <InlineField label="TLS Enabled">
    <InlineSwitch label="TLS Enabled" value={value} onChange={handleOnChange} />
  </InlineField>
</div>
```

Use the `switch` model from the [`components` fixture](./use-the-api.md#components) to interact with the component. It resolves the switch element across Grafana versions, and its `check` and `uncheck` methods are idempotent, so they only click the switch when the state needs to change, which avoids races with React's re-render cycle.

```ts title="Playwright test"
const tlsField = page.getByTestId('config-tls-field');

// checking
await components.switch.within(tlsField).check();
await expect(components.switch.within(tlsField)).toBeChecked();

// unchecking
await components.switch.within(tlsField).uncheck();
await expect(components.switch.within(tlsField)).not.toBeChecked();
```
