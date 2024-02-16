import { test as base, expect as baseExpect, selectors } from '@playwright/test';
import { E2ESelectors } from './e2e-selectors/types';
import fixtures from './fixtures';
import matchers from './matchers';
import {
  CreateDataSourceArgs,
  CreateDataSourcePageArgs,
  DataSourceSettings,
  ReadProvisionedDashboardArgs,
  ReadProvisionedDataSourceArgs,
  CreateUserArgs,
} from './types';
import {
  PanelEditPage,
  GrafanaPage,
  DataSourceConfigPage,
  DashboardPage,
  VariableEditPage,
  AnnotationEditPage,
} from './models';
import { grafanaE2ESelectorEngine } from './selectorEngine';
import { ExplorePage } from './models/ExplorePage';
import options from './options';

export type PluginOptions = {
  /**
   * When using the readProvisioning fixture, files will be read from this directory. If no directory is provided,
   * the 'provisioning' directory in the current working directory will be used.
   *
   * eg.
   * export default defineConfig({
      use: {
        provisioningRootDir: 'path/to/provisioning',
      },
    });
   *
   */
  provisioningRootDir: string;
  /**
   * Optionally, you can add or override feature toggles.
   * The feature toggles you specify here will only work in the frontend. If you need a feature toggle to work across the entire stack, you
   * need to need to enable the feature in the Grafana config. See https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#feature_toggles
   *
   * To override feature toggles globally in the playwright.config.ts file: 
   * export default defineConfig({
      use: {
        featureToggles: {
          exploreMixedDatasource: true,
          redshiftAsyncQueryDataSupport: false
        },
      },
    });
   * 
   * To override feature toggles for tests on a certain file:
     test.use({
      featureToggles: {
        exploreMixedDatasource: true,
      },
   * });
   */
  featureToggles: Record<string, boolean>;

  /**
   * The Grafana user to use for the tests. If no user is provided, the default admin/admin user will be used.
   *
   * You can use different users for different projects. See the fixture createUser for more information on how to create a user,
   * and the fixture login for more information on how to authenticate.
   */
  user?: CreateUserArgs;
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
   * Navigates to a new dashboard page and adds a new panel.
   *
   * Use {@link PanelEditPage.setVisualization} to change the visualization
   * Use {@link PanelEditPage.datasource.set} to change the datasource
   * Use {@link ExplorePage.getQueryEditorEditorRow} to retrieve the query
   * editor row locator for a given query refId
   */
  panelEditPage: PanelEditPage;

  /**
   * Isolated {@link VariableEditPage} instance for each test.
   *
   * Navigates to a new dashboard page and adds a new variable.
   *
   * Use {@link VariableEditPage.setVariableType} to change the variable type
   */
  variableEditPage: VariableEditPage;

  /**
   * Isolated {@link AnnotationEditPage} instance for each test.
   *
   * Navigates to a new dashboard page and adds a new annotation.
   *
   * Use {@link AnnotationEditPage.datasource.set} to change the datasource
   */
  annotationEditPage: AnnotationEditPage;

  /**
   * Isolated {@link ExplorePage} instance for each test.
   *
   * Navigates to a the explore page.
   *
   * Use {@link ExplorePage.datasource.set} to change the datasource
   * Use {@link ExplorePage.getQueryEditorEditorRow} to retrieve the query editor
   * row locator for a given query refId
   */
  explorePage: ExplorePage;

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
  createDataSource: (args: CreateDataSourceArgs) => Promise<DataSourceSettings>;

  /**
   * Fixture command that creates a user via the Grafana API and assigns a role to it if a role is provided
   * This may be useful if your plugin supports RBAC and you need to create a user with a specific role. See login fixture for more information.
   */
  createUser: () => Promise<void>;

  /**
   * Fixture command that login to Grafana using the Grafana API and stores the cookie state on disk.
   * The file name for the storage state will be `playwright/.auth/<username>.json`, so it's important that the username is unique.
   * 
   * If you have not specified a user, the default admin/admin credentials will be used. 
   * 
   * e.g
   * projects: [
      {
        name: 'authenticate',
        testDir: './src/auth',
        testMatch: [/.*auth\.setup\.ts/],
      },
      {
        name: 'run tests as admin user',
        testDir: './tests',
        use: {
          ...devices['Desktop Chrome'],
          storageState: 'playwright/.auth/admin.json',
        },
        dependencies: ['authenticate'],
      }
    }
   *
   * If your plugin supports RBAC, you may want to use different projects for different roles. 
   * In the following example, a new user with the role `Viewer` gets created and authenticated in a `createUserAndAuthenticate` project.
   * In the `viewer` project, authentication state from the previous project is used in all tests in the ./tests/viewer folder.
   * projects: [
      {
        name: 'createUserAndAuthenticate',
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
        name: 'viewer',
        testDir: './tests/viewer',
        use: {
          ...devices['Desktop Chrome'],
          storageState: 'playwright/.auth/viewer.json',
        },
        dependencies: ['createUserAndAuthenticate'],
      }
    }
   *
   * To override credentials in a single test:
   * test.use({ storageState: 'playwright/.auth/admin.json', user: { user: 'admin', password: 'admin' } });
   * To avoid authentication in a single test:
   * test.use({ storageState: { cookies: [], origins: [] } });
   */
  login: () => Promise<void>;

  /**
   * Fixture command that reads a yaml file in the provisioning/datasources directory.
   *
   * The file name should be the name of the file with the .yaml|.yml extension.
   * If a data source name is provided, the first data source that matches the name will be returned.
   * If no name is provided, the first data source in the list of data sources will be returned.
   */
  readProvisionedDataSource<T = {}, S = {}>(args: ReadProvisionedDataSourceArgs): Promise<DataSourceSettings<T, S>>;

  /**
   * Fixture command that reads a dashboard json file in the provisioning/dashboards directory.
   *
   * Can be useful when navigating to a provisioned dashboard and you don't want to hard code the dashboard UID.
   */
  readProvisionedDashboard(args: ReadProvisionedDashboardArgs): Promise<Dashboard>;

  /**
   * Function that checks if a feature toggle is enabled. Only works for frontend feature toggles.
   */
  isFeatureToggleEnabled<T = object>(featureToggle: keyof T): Promise<boolean>;
};

// extend Playwright with Grafana plugin specific fixtures
export const test = base.extend<PluginFixture, PluginOptions>({ ...fixtures, ...options });

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
