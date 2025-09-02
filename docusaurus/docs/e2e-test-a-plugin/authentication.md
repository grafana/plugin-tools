---
id: use-authentication
title: Authentication
description: Add authentication to end-to-end tests using the plugin-e2e tool.
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - end-to-end
  - authentication
sidebar_position: 40
---

## Introduction

To be able to interact with the Grafana UI, you need to be logged in to Grafana. `@grafana/plugin-e2e` provides a declarative way to handle authentication and create users. In this guide, you will see examples of how to do this with and without using role-based access control (RBAC) in your plugin.

## Plugins that don't use RBAC

If your plugin doesn't use RBAC, you can use the default server administrator credentials to login.

In the following example, there's a [setup project](https://playwright.dev/docs/test-global-setup-teardown#setup-example) called `auth`. This project invokes a function in the `@grafana/plugin-e2e` package that logs in to Grafana using `admin:admin`. The authenticated state is stored on disk with this file name pattern: `<plugin-root>/playwright/.auth/<username>.json`.

The second project, `run-tests`, runs all tests in the `./tests` directory. This project reuses the authentication state from the `auth` project. As a consequence, login only happens once, and all tests in the `run-tests` project start already authenticated.

```ts title="playwright.config.ts"
import { dirname } from 'path';
import { defineConfig, devices } from '@playwright/test';

const pluginE2eAuth = `${dirname(require.resolve('@grafana/plugin-e2e'))}/auth`;

export default defineConfig({
    ...
    projects: [
    {
      name: 'auth',
      testDir: pluginE2eAuth,
      testMatch: [/.*\.js/],
    },
    {
      name: 'run-tests',
      use: {
        ...devices['Desktop Chrome'],
        // @grafana/plugin-e2e writes the auth state to this file,
        // the path should not be modified
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['auth'],
    }
  ],
});
```

## Plugins that use RBAC

If your plugin uses RBAC, you may want to write tests that verify that certain plugin features are role-based.

The `@grafana/plugin-e2e` tool lets you define users with roles in the Playwright config file. In the following example, a new user with the role `Viewer` is created in the `createViewerUserAndAuthenticate` setup project. In the next project, authentication state for the user with the viewer role is reused when running the tests. Note that tests that are specific for the `Viewer` role have been added to a dedicated `testDir`.

```ts title="playwright.config.ts"
import { dirname } from 'path';
import { defineConfig, devices } from '@playwright/test';

const pluginE2eAuth = `${dirname(require.resolve('@grafana/plugin-e2e'))}/auth`;

export default defineConfig<PluginOptions>({
  ...
  projects: [
      {
        name: 'createViewerUserAndAuthenticate',
        testDir: pluginE2eAuth,
        testMatch: [/.*auth\.setup\.ts/],
        use: {
          user: {
            user: 'viewer',
            password: 'password',
            role: 'Viewer',
          },
        },
      },
      {
        name: 'run-tests-for-viewer',
        testDir: './tests/viewer',
        use: {
          ...devices['Desktop Chrome'],
          // @grafana/plugin-e2e writes the auth state to this file,
          // the path should not be modified
          storageState: 'playwright/.auth/viewer.json',
        },
        dependencies: ['createViewerUserAndAuthenticate'],
      },
  ]
})
```

## Managing users

When a `user` is defined in a setup project (like in the RBAC example above) `plugin-e2e` will use the Grafana HTTP API to create the user account. This action requires elevated permissions, so by default the server administrator credentials `admin:admin` will be used. If the end-to-end tests are targeting the [development environment](../set-up/) scaffolded with `create-plugin`, this will work fine. However for other test environments the server administrator password may be different. In that case, we search for GRAFANA_ADMIN_USER and GRAFANA_ADMIN_PASSWORD environment variables. Additionally you can provide the correct credentials by setting `grafanaAPICredentials` in the global options.

```ts title="playwright.config.ts"
import { dirname } from 'path';
import { defineConfig, devices } from '@playwright/test';

const pluginE2eAuth = `${dirname(require.resolve('@grafana/plugin-e2e'))}/auth`;

export default defineConfig<PluginOptions>({
  testDir: './tests',
  use: {
    baseURL: process.env.GRAFANA_URL || 'http://localhost:3000',
    grafanaAPICredentials: {
      user: process.env.GRAFANA_ADMIN_USER || 'admin',
      password: process.env.GRAFANA_ADMIN_PASSWORD || 'admin',
    },
  },
  projects: [
    ...
  ]
})
```
