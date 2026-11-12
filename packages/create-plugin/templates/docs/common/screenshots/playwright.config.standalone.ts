import type { PluginOptions } from '@grafana/plugin-e2e';
import { defineConfig, devices } from '@playwright/test';
import { dirname } from 'node:path';

const theme = process.env.DOCS_SCREENSHOTS_THEME ?? 'dark';
if (theme !== 'dark' && theme !== 'light') {
  throw new Error(`DOCS_SCREENSHOTS_THEME must be "dark" or "light", not "${theme}".`);
}

const pluginE2eAuth = `${dirname(require.resolve('@grafana/plugin-e2e'))}/auth`;

/**
 * Takes the screenshots for the plugin docs. Run it with the `docs:screenshots` script while Grafana is running.
 * Set GRAFANA_URL when Grafana runs somewhere other than http://localhost:3000, and DOCS_SCREENSHOTS_THEME to
 * "light" for light theme screenshots.
 */
export default defineConfig<PluginOptions>({
  testDir: '.',
  outputDir: '../test-results/docs-screenshots',
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.GRAFANA_URL || 'http://localhost:3000',
  },
  projects: [
    {
      name: 'auth',
      testDir: pluginE2eAuth,
      testMatch: [/.*\.js/],
    },
    {
      name: 'screenshots',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
        userPreferences: { theme },
      },
      dependencies: ['auth'],
    },
  ],
});
