import { test as base } from '@playwright/test';
import { E2ESelectors } from './e2e-selectors/types';
import fixtures from './fixtures';

export type PluginOptions = {
  selectorRegistration: void;
};

export type PluginFixture = {
  /**
   * The current Grafana version.
   *
   * If a GRAFANA_VERSION environment variable is set, this will be used. Otherwise,
   * the version will be picked from window.grafanaBootData.settings.buildInfo.version.
   */
  grafanaVersion: string;

  /**
   * The E2E selectors to use for the current version of Grafana
   */
  selectors: E2ESelectors;

  /**
   * Fixture command that will logs in to Grafana using the Grafana API. 
   * If the same credentials should be used in every test, 
   * invoke this fixture in a setup project.
   * See https://playwright.dev/docs/auth#basic-shared-account-in-all-tests
   * 
   * If no credentials are provided, the default admin/admin credentials will be used.
   * 
   * The default credentials can be overridden in the playwright.config.ts file:
   * eg.
   * export default defineConfig({
      use: {
        httpCredentials: {
          username: 'user',
          password: 'pass',
        },
      },
    });
   * 
   * To override credentials in a single test:
   * test.use({ httpCredentials: { username: 'admin', password: 'admin' } });
   * To avoid authentication in a single test:
   * test.use({ storageState: { cookies: [], origins: [] } });
   */
  login: () => Promise<void>;
};

// extend Playwright with Grafana plugin specific fixtures
export const test = base.extend<PluginFixture & PluginOptions>(fixtures);

export { selectors, expect } from '@playwright/test';
