---
id: app-configurations
title: Test configurations
description: Test the configuration editor of an app
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - app
  - configuration editor
  - config
sidebar_position: 20
---

# Test the configuration editor of an app

The app configuration page manages the configurations for your app if it requires some kind of configuration to function. This guide explains how to create an app-specific fixture to make it easier to write tests and share logic across different tests.

## Test an app config page

Apps have a [health check](../../introduction/backend.md#health-checks) endpoint that is used to test the validity of the configuration. In the following example, the configuration editor form is populated with valid values when the **Save & test** button is clicked. 

A click on the **Save & test** button calls the Grafana backend to save the configuration, then passes the configuration to the health check endpoint. The test is successful only if both calls yield a successful status code.

### Config page with a basic UI

Add an `appConfigPage` value by using a navigation function that returns the default `AppConfigPage` defined in `@grafana/plugin-e2e`. 

For example:

```ts title="fixtures.ts"
import { AppConfigPage, test as base } from '@grafana/plugin-e2e';
import pluginJson from '../src/plugin.json';

type AppTestFixture = {
  appConfigPage: AppConfigPage;
};

export const test = base.extend<AppTestFixture>({
  appConfigPage: async ({ gotoAppConfigPage }, use) => {
    const configPage = await gotoAppConfigPage({
      pluginId: pluginJson.id,
    });
    await use(configPage);
  },
});

export { expect } from '@grafana/plugin-e2e';
```

To use the value, import `test` and `expect` from your fixture instead of `@grafana/plugin-e2e`. When you destructure the `appConfigPage` in your test function, the rest automatically navigates to the config page. 

For example:

```ts title="configurationEditor.spec.ts"
import { test, expect } from './fixtures.ts';

test('"Save & test" should be successful when configuration is valid', async ({ appConfigPage, page }) => {
  const saveButton = page.getByRole('button', { name: /Save & test/i });

  await page.getByRole('textbox', { name: 'API Key' }).fill('secret-api-key');
  await page.getByRole('textbox', { name: 'API Url' }).clear();
  await page.getByRole('textbox', { name: 'API Url' }).fill('http://www.my-awsome-grafana-app.com/api');

  const saveResponse = appConfigPage.waitForSettingsResponse();

  await saveButton.click();
  await expect(saveResponse).toBeOK();
});
```

### Config page with a complex UI

Add an `appConfigPage` by using a navigation function that returns the default `AppConfigPage` defined in `@grafana/plugin-e2e`. 

For example:

```ts title="fixtures.ts"
import { AppConfigPage, test as base } from '@grafana/plugin-e2e';
import pluginJson from '../src/plugin.json';

class MyAppConfigPage extends AppConfigPage {
  async fillApiKey(key: string): Promise<void> {
    await page.getByRole('textbox', { name: 'API Key' }).fill(key);
  }

  async fillApiUrl(url: string): Promise<void> {
    await page.getByRole('textbox', { name: 'API Url' }).clear();
    await page.getByRole('textbox', { name: 'API Url' }).fill(url);
  }

  async save(): Promise<void> {
    await page.getByRole('button', { name: /Save & test/i }).click();
  }
}

type AppTestFixture = {
  appConfigPage: MyAppConfigPage;
};

export const test = base.extend<AppTestFixture>({
  appConfigPage: async ({ page, selectors, grafanaVersion, request }, use, testInfo) => {
    const configPage = new MyAppConfigPage(
      { page, selectors, grafanaVersion, request, testInfo },
      {
        pluginId: pluginJson.id,
      }
    );
    await configPage.goto();
    await use(configPage);
  },
});

export { expect } from '@grafana/plugin-e2e';
```

To use the value, import `test` and `expect` from your fixture instead of `@grafana/plugin-e2e`. When you destructure the `appConfigPage` in your test function, the test automatically navigates to the config page.

For example:

```ts title="configurationEditor.spec.ts"
import { test, expect } from './fixtures.ts';

test('"Save & test" should be successful when configuration is valid', async ({ appConfigPage, page }) => {
  await appConfigPage.fillApiKey('secret-api-key');
  await appConfigPage.fillApiUrl('http://www.my-awsome-grafana-app.com/api');

  const saveResponse = appConfigPage.waitForSettingsResponse();

  await appConfigPage.save();
  await expect(saveResponse).toBeOK();
});
```

## Test error scenarios

In some cases when the provided configuration is not valid, you may want to capture errors from the upstream API and return a meaningful error message to the user. 

For example:

```ts title="configurationEditor.spec.ts"
import { test, expect } from './fixtures.ts';

test('"Save & test" should fail when configuration is invalid', async ({ appConfigPage, page }) => {
  const saveButton = page.getByRole('button', { name: /Save & test/i });

  await page.getByRole('textbox', { name: 'API Url' }).clear();
  await page.getByRole('textbox', { name: 'API Url' }).fill('not a url');

  const saveResponse = appConfigPage.waitForSettingsResponse();

  await saveButton.click();

  await expect(appConfigPage).toHaveAlert('error');
  await expect(saveResponse).not.toBeOK();
});
```
