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
const config = defineConfig<PluginOptions>(baseConfig, {
  testDir: '.',
  outputDir: '../test-results/docs-screenshots',
  retries: 0,
  reporter: 'list',
});

// one Chromium project, because every project would take each screenshot again and WebKit can't encode WebP
const projects = config.projects ?? [];
const setupProjects = new Set(projects.flatMap((project) => project.dependencies ?? []));
const browserProject = projects.find(
  (project) =>
    !setupProjects.has(project.name ?? '') &&
    (project.use?.defaultBrowserType ?? project.use?.browserName ?? 'chromium') === 'chromium'
);
if (!browserProject) {
  throw new Error('docs:screenshots needs a Chromium project in playwright.config.ts.');
}

// a project's own testDir and a device preset's viewport win over the top-level settings, so they're set here
config.projects = [
  ...projects.filter((project) => browserProject.dependencies?.includes(project.name ?? '')),
  {
    ...browserProject,
    testDir: '.',
    testMatch: undefined,
    testIgnore: undefined,
    use: {
      ...browserProject.use,
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
      userPreferences: { theme },
    },
  },
];

export default config;
