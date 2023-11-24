import { test as base, expect as baseExpect, selectors } from '@playwright/test';
import { E2ESelectors } from './e2e-selectors/types';
import fixtures from './fixtures';
import matchers from './matchers';
import { CreateDataSourceArgs, CreateDataSourcePageArgs, DataSource, ReadProvisionArgs } from './types';
import { PanelEditPage, GrafanaPage, DataSourceConfigPage, DashboardPage } from './models';
import { grafanaE2ESelectorEngine } from './selectorEngine';

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
   * Isolated {@link DashboardPage} instance for each test.
   *
   * Navigates to a new dashboard page and adds a new panel.
   *
   * Use {@link PanelEditPage.setVisualization} to change the visualization
   * Use {@link PanelEditPage.datasource.set} to change the datasource
   * Use {@link PanelEditPage.getQueryEditorEditorRow} to retrieve the query
   * editor row locator for a given query refId
   */
  newDashboardPage: DashboardPage;

  /**
   * Isolated {@link PanelEditPage} instance for each test.
   *
   * Navigates to a new dashboard page, adds a new panel and moves to the panel edit page. 
   *
   * Use {@link PanelEditPage.setVisualization} to change the visualization
   * Use {@link PanelEditPage.datasource.set} to change the datasource
   * Use {@link ExplorePage.getQueryEditorEditorRow} to retrieve the query
   * editor row locator for a given query refId
   */
  panelEditPage: PanelEditPage;

  /**
   * Fixture command that will create an isolated DataSourceConfigPage instance for a given data source type.
   *
   * The data source config page cannot be navigated to without a data source uid, so this fixture will create a new
   * data source using the Grafana API, create a new DataSourceConfigPage instance and navigate to the page.
   */
  createDataSourceConfigPage: (args: CreateDataSourcePageArgs) => Promise<DataSourceConfigPage>;

  /**
   * Fixture command that creates a data source via the Grafana API.
   *
   * If you have tests that depend on the the existance of a data source,
   * you may use this command in a setup project. Read more about setup projects
   * here: https://playwright.dev/docs/auth#basic-shared-account-in-all-tests
   */
  createDataSource: (args: CreateDataSourceArgs) => Promise<DataSource>;

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

  /**
   * Fixture command that reads a the yaml file for a provisioned dashboard
   * or data source and returns it as json.
   */
  readProvision<T = any>(args: ReadProvisionArgs): Promise<T>;
};

// extend Playwright with Grafana plugin specific fixtures
export const test = base.extend<PluginFixture & PluginOptions>(fixtures);

export const expect = baseExpect.extend(matchers);

/** Register a custom selector engine that resolves locators for Grafana E2E selectors
 *
 * The same functionality is available in the {@link GrafanaPage.getByTestIdOrAriaLabel} method. However,
 * by registering the selector engine, one can resolve locators by Grafana E2E selectors also within a locator.
 *
 * Example:
 * const queryEditorRow = await panelEditPage.getQueryEditorRow('A'); // returns a locator
 * queryEditorRow.locator(`selector=${selectors.components.TimePicker.openButton}`).click();
 * */
selectors.register('selector', grafanaE2ESelectorEngine);

export { selectors } from '@playwright/test';
