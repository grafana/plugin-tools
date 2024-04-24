---
id: configurations
title: Test configurations
description: Testing the configuration editor of an app with valid and invalid configuration
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

## Introduction

Many app plugins need some kind of configuration to function. The appropriate place for managing this config is in the app configuration page.

### Define an app specific fixture

To reduce repetition and the need to import `pluginJson` in all your test files you can define an app specific test fixture which lets you provide your plugin id once so it can be reused in all your tests.

In the fixture below we are extending playwright with an `appConfigPage` so it can be used, to interact with your plugin app config, in any of your tests.

```ts title="fixtures.ts"
import { AppConfigPage, AppPage, test as base } from '@grafana/plugin-e2e';
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

### Testing the configuration in an app

Apps has a [health check](../../introduction/backend.md#health-checks) endpoint that is used to test whether the configuration is valid or not. In the following example, the configuration editor form is populated with valid values then the `Save & test` button is clicked. Clicking `Save & test` calls the Grafana backend to save the configuration, then passes configuration to the health check endpoint. The test will be successful only if both calls yields a successful status code.

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

#### Testing error scenarios

In some cases when the provided configuration is not valid, you may want to capture errors from the upstream API and return a meaningful error message to the user.

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
