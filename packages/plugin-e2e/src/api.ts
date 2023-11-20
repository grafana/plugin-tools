import { test as base, expect as baseExpect } from '@playwright/test';
import { E2ESelectors } from './e2e-selectors/types';
import fixtures from './fixtures';
import { DataSourceConfigPage } from './models';
import matchers from './matchers';
import { CreateDataSourcePageArgs } from './types';

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
   * Fixture command that will create an isolated DataSourceConfigPage instance for a given data source type.
   *
   * The data source config page cannot be navigated to without a data source uid, so this fixture will create a new
   * data source using the Grafana API, create a new DataSourceConfigPage instance and navigate to the page.
   */
  createDataSourceConfigPage: (args: CreateDataSourcePageArgs) => Promise<DataSourceConfigPage>;

  /**
   * Fixture command that login to Grafana using the Grafana API. 
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

export const expect = baseExpect.extend(matchers);

export { selectors } from '@playwright/test';
