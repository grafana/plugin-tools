---
id: authentication
title: Authentication
description: Authentication
draft: true
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - authentication
sidebar_position: 2
---

# Introduction

To be able to interact with the Grafana UI, you need to be logged in to Grafana. `@grafana/plugin-e2e` provides ways to handle authentication and testing your plugin with role-based access control (RBAC).

## Plugins that don't use RBAC

If your plugin don't use RBAC, you can use the default server administrator credentials to login. The following snippet is a [setup project](https://playwright.dev/docs/test-global-setup-teardown#setup-example) that invokes a function in the `@grafana/plugin-e2e` package that will login to Grafana using `admin:admin`. The authenticated state is stored on disk and the file name pattern is as follows: `<plugin-root>/playwright/.auth/<username>.json`.

```ts
// playwright.config.js|ts
projects: [
  {
    name: 'auth',
    testDir: 'node_modules/@grafana/plugin-e2e/dist/auth',
    testMatch: [/.*\.js/],
  },
];
```

The next project we add will run all tests in the `./tests` directory. We're reusing the authentication state from the `auth` project that we just added. This means login will only happen once, and all tests in the `run-tests` project will start already authenticated.

```ts
projects: [
  {
    name: 'auth',
    testDir: 'node_modules/@grafana/plugin-e2e/dist/auth',
    testMatch: [/.*\.js/],
  },
  {
    name: 'run-tests',
    testDir: './tests',
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.auth/admin.json',
    },
    dependencies: ['auth'],
  },
];
```

## Plugins that use RBAC

If your plugin uses RBAC, you may want to write tests that verifies that certain plugin features are role-based. `@grafana/plugin-e2e` provides a declarative way of defining new users and roles. In the following example, a new users with the role `Viewer` is created in the `createViewerUserAndAuthenticate` setup project. In the next project, authentication state for the viewer user is reused when running the tests. Note that tests that are specific for the `Viewer` role have been added to a dedicated `testDir`.

```ts
projects: [
    {
      name: 'createViewerUserAndAuthenticate',
      testDir: 'node_modules/@grafana/plugin-e2e/dist/auth',
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
        storageState: 'playwright/.auth/viewer.json',
      },
      dependencies: ['createViewerUserAndAuthenticate'],
    },
  ],
```
