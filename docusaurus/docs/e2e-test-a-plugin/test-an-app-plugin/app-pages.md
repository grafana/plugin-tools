---
id: app-pages
title: Test pages added by an app
description: How to test pages added by an app
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - app
sidebar_position: 10
---

# Test pages added by an app

The `/a/${pluginId}/` route is available to allow you to access pages added by an app. To prevent repetition and the need to import `plugin.json` in your tests, there are a set of page classes and navigation functions.

This guide shows you how to create an app-specific fixture to make it easier to write tests and share logic across different tests.

## Page with a basic UI

If you want to test a page with basic UI that is easy to interact with via the standard Playwright APIs, then use a navigation function such as `gotoPage`.

For example:

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

To use this function, simply import `test` and `expect` from your fixture instead of importing it from `@grafana/plugin-e2e`, and then write your test as you would normally.

For example:

```ts title="startPage.spec.ts"
import { test, expect } from './fixtures.ts';

test('start page should welcome users to the app', async ({ gotoPage, page }) => {
  await gotoPage('/start');
  await expect(page.getByRole('heading', { name: 'Welcome to my app' })).toBeVisible();
});
```

## Page with a complex UI

If, on the other hand, you have a page with a complex UI that might not be easy to interact with via the standard Playwright APIs, then you need a different approach. As a best practice, create a page object that can encapsulate the page's logic in functions.

This is especially helpful if you want to reuse that selector logic in multiple tests. The example below showcases how to extend the standard fixture with a page object. We have simplified the `getWelcomeText` logic to highlight the page object pattern without introducing unnecessary complexity to this example.

For example:

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

To use this code, you simply import `test` and `expect` from your fixture instead of importing them from `@grafana/plugin-e2e`, and then you write your test as you would normally. When you destructure the `startPage` in your test function, the test automatically navigates to that page.

For example:

```ts title="startPage.spec.ts"
import { test, expect } from './fixtures.ts';

test('start page should welcome users to the app', async ({ startPage }) => {
  await expect(startPage.getWelcomeText()).toBeVisible();
});
```
