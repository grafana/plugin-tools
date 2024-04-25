---
id: app-pages
title: Test pages
description: Testing pages added by an app
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - app
sidebar_position: 10
---

## Introduction

Pages added by an app plugin can be accesssed below the `/a/${pluginId}/` route. To prevent repetition and the need of importing `plugin.json` in your tests we provide a set of page classes and navigation functions.

We recommend you to create an app specific fixture to make it easier to write tests and share logic across different tests.

## Page with a basic UI

If you want to test a page with basic UI that are easy to interact with via the standard playwright APIs we suggest to use a navigation function such as the `gotoPage` in the example below.

```ts title="fixtures.ts"
import { AppPage, test as base } from '@grafana/plugin-e2e';
import pluginJson from '../src/plugin.json';

type AppTestFixture = {
  gotoPage: (path?: string) => Promise<AppPage>;
};

export const test = base.extend<AppTestFixture>({
  gotoPage: async ({ gotoAppPage }, use) => {
    await use((path) =>
      gotoAppPage({
        path,
        pluginId: pluginJson.id,
      })
    );
  },
});

export { expect } from '@grafana/plugin-e2e';
```

To use it you simply import test and expect from your fixture instead of importing it from `@grafana/plugin-e2e` and you write your test as you normally would do.

```ts title="startPage.spec.ts"
import { test, expect } from './fixtures.ts';

test('start page should welcome users to the app', async ({ gotoPage, page }) => {
  await gotoPage('/start');
  await expect(page.getByRole('heading', { name: 'Welcome to my app' })).toBeVisible();
});
```

## Page with a complex UI

If you, on the other hand, have a page with a complex UI that might not be easy to interact with via the standard playwright APIs we suggest to create a page object that can encapsulate that logic in functions.

Especially if you want to reuse that selector logic in multiple tests. The example below show case how to extend the standard fixture with a page object. The `getWelcomeText` is simplified since we want to highlight the page object pattern rather than how to write a complex selector logic.

```ts title="fixtures.ts"
import { AppPage, PluginTestCtx, PluginPageArgs, test as base } from '@grafana/plugin-e2e';
import pluginJson from '../src/plugin.json';

class StartPage extends AppPage {
  private path: string;

  constructor(ctx: PluginTestCtx, args: PluginPageArgs & { path: string }) {
    super(ctx, args);
    this.path = args.path;
  }

  goto(): Promise<void> {
    return super.goto({ path: this.path });
  }

  getWelcomeText(): Locator {
    const { page } = this.ctx;
    return page.getByRole('heading', { name: 'Welcome to my app' });
  }
}

type AppTestFixture = {
  startPage: StartPage;
};

export const test = base.extend<AppTestFixture>({
  startPage: async ({ page, selectors, grafanaVersion, request }, use, testInfo) => {
    const startPage = new StartPage(
      { page, selectors, grafanaVersion, request, testInfo },
      {
        pluginId: pluginJson.id,
        path: '/start',
      }
    );
    await startPage.goto();
    await use(startPage);
  },
});

export { expect } from '@grafana/plugin-e2e';
```

To use it you simply import test and expect from your fixture instead of importing it from `@grafana/plugin-e2e` and you write your test as you normally would do. When destructuring the `startPage` in your test function the test will automatically navigate to that page.

```ts title="startPage.spec.ts"
import { test, expect } from './fixtures.ts';

test('start page should welcome users to the app', async ({ startPage }) => {
  await expect(startPage.getWelcomeText()).toBeVisible();
});
```
