import type { PluginOptions } from '@grafana/plugin-e2e';
import { defineConfig } from '@playwright/test';
import baseConfig from '../playwright.config';

const theme = process.env.DOCS_SCREENSHOTS_THEME ?? 'dark';
if (theme !== 'dark' && theme !== 'light') {
  throw new Error(`DOCS_SCREENSHOTS_THEME must be "dark" or "light", not "${theme}".`);
}

/**
 * Takes the screenshots for the plugin docs. Run it with the `docs:screenshots` script while Grafana is running.
 * Set DOCS_SCREENSHOTS_THEME to "light" for light theme screenshots.
 */
export default defineConfig<PluginOptions>(baseConfig, {
  testDir: '.',
  outputDir: '../test-results/docs-screenshots',
  retries: 0,
  reporter: 'list',
  // a device preset in the base config sets its own viewport, so these are set per project to win
  projects: (baseConfig.projects ?? []).map((project) =>
    project.name === 'auth'
      ? project
      : {
          ...project,
          use: {
            ...project.use,
            viewport: { width: 1280, height: 800 },
            deviceScaleFactor: 1,
            userPreferences: { theme },
          },
        }
  ),
});
