// This file is not part of the @grafana/plugin-e2e package. It's only used for testing the plugin-e2e package itself.

import { defineConfig, devices } from '@playwright/test';
import { PluginOptions } from './src';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig<PluginOptions>({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    httpCredentials: {
      username: 'admin',
      password: 'admin',
    },
    featureToggles: {
      redshiftAsyncQueryDataSupport: false,
    },
  },

  /* List of projects to run. See https://playwright.dev/docs/test-configuration#projects */
  projects: [
    // Login to Grafana with admin user and store the cookie on disk for use in other tests
    {
      name: 'authenticate',
      testDir: './src/auth',
      testMatch: [/.*auth\.setup\.ts/],
    },
    // Login to Grafana with new user with viewer role and store the cookie on disk for use in other tests
    {
      name: 'createUserAndAuthenticate',
      testDir: './src/auth',
      testMatch: [/.*auth\.setup\.ts/],
      use: {
        user: {
          user: 'viewer',
          password: 'password',
          role: 'Viewer',
        },
      },
    },
    // Run all tests in parallel using user with admin role
    {
      name: 'admin',
      testDir: './tests/as-admin-user',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['authenticate'],
    },
    // Run all tests in parallel using user with viewer role
    {
      name: 'viewer',
      testDir: './tests/as-viewer-user',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/viewer.json',
      },
      dependencies: ['createUserAndAuthenticate'],
    },
  ],
});
