import {
  Locator,
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
  Response,
  TestInfo,
} from '@playwright/test';

import { E2ESelectors } from './e2e-selectors/types';
import { AnnotationEditPage } from './models/pages/AnnotationEditPage';
import { AppConfigPage } from './models/pages/AppConfigPage';
import { AppPage } from './models/pages/AppPage';
import { DashboardPage } from './models/pages/DashboardPage';
import { DataSourceConfigPage } from './models/pages/DataSourceConfigPage';
import { ExplorePage } from './models/pages/ExplorePage';
import { PanelEditPage } from './models/pages/PanelEditPage';
import { VariableEditPage } from './models/pages/VariableEditPage';

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
   * need to need to enable the feature in the Grafana config. Also see https://grafana.com/developers/plugin-tools/e2e-test-a-plugin/feature-toggles
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
   * To override feature toggles for tests in a certain file:
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
   * and the fixture login for more information on how to authenticate. Also see https://grafana.com/developers/plugin-tools/e2e-test-a-plugin/use-authentication
   */
  user?: CreateUserArgs;
};

export type PluginFixture = {
  /**
   * The Grafana version that was detected when the test runner was started.
   *
   * If a GRAFANA_VERSION environment variable is set, this will be used. Otherwise,
   * the version will be picked from window.grafanaBootData.settings.buildInfo.version.
   */
  grafanaVersion: string;

  /**
   * The E2E selectors to use for the current version of Grafana.
   * See https://grafana.com/developers/plugin-tools/e2e-test-a-plugin/selecting-elements#grafana-end-to-end-selectors for more information.
   */
  selectors: E2ESelectors;

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

  /**
   * Isolated {@link DashboardPage} instance for each test.
   *
   * When using this fixture in a test, you will get a new, empty dashboard page.
   * To load an existing dashboard, use the {@link gotoDashboardPage} fixture.
   */
  dashboardPage: DashboardPage;

  /**
   * Isolated {@link PanelEditPage} instance for each test.
   *
   * Navigates to a new dashboard page and adds a new panel.
   *
   * When using this fixture in a test, you will get a new dashboard page with a new empty panel edit page
   * To load an existing dashboard with an existing panel, use the {@link gotoPanelEditPage} fixture.
   */
  panelEditPage: PanelEditPage;

  /**
   * Isolated {@link VariableEditPage} instance for each test.
   *
   * When using this fixture in a test, you will get a new dashboard page with a new empty variable edit page
   * To load an existing dashboard with an existing variable, use the {@link gotoVariableEditPage} fixture.
   */
  variableEditPage: VariableEditPage;

  /**
   * Isolated {@link AnnotationEditPage} instance for each test.
   *
   * When using this fixture in a test, you will get a new dashboard page with a new empty annotation edit page
   * To load an existing dashboard with an existing annotation, use the {@link gotoAnnotationEditPage} fixture.
   */
  annotationEditPage: AnnotationEditPage;

  /**
   * Isolated {@link ExplorePage} instance for each test.
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
   * Fixture command that navigates to an already exist dashboard. Returns a DashboardPage instance.
   */
  gotoDashboardPage: (args: DashboardPageArgs) => Promise<DashboardPage>;

  /**
   * Fixture command that navigates a panel edit page for an already existing panel in a dashboard.
   */
  gotoPanelEditPage: (args: DashboardEditViewArgs<string>) => Promise<PanelEditPage>;

  /**
   * Fixture command that navigates a variable edit page for an already existing variable query in a dashboard.
   */
  gotoVariableEditPage: (args: DashboardEditViewArgs<string>) => Promise<VariableEditPage>;

  /**
   * Fixture command that navigates an annotation edit page for an already existing annotation query in a dashboard.
   */
  gotoAnnotationEditPage: (args: DashboardEditViewArgs<string>) => Promise<AnnotationEditPage>;

  /**
   * Fixture command that navigates a configuration page for an already existing data source instance.
   */
  gotoDataSourceConfigPage: (uid: string) => Promise<DataSourceConfigPage>;

  /**
   * Fixture command that navigates to the AppConfigPage for a given plugin.
   */
  gotoAppConfigPage: (args: GotoAppConfigPageArgs) => Promise<AppConfigPage>;

  /**
   * Fixture command that navigates to an AppPage for a given plugin.
   */
  gotoAppPage: (args: GotoAppPageArgs) => Promise<AppPage>;
};

/**
 * The context object passed to page object models
 */
export type PluginTestCtx = { grafanaVersion: string; selectors: E2ESelectors; testInfo: TestInfo } & Pick<
  PlaywrightTestArgs,
  'page' | 'request'
>;

/**
 * Playwright args used when defining fixtures
 */
export type PlaywrightArgs = PluginFixture &
  PluginOptions &
  PlaywrightTestArgs &
  PlaywrightTestOptions &
  PlaywrightWorkerArgs &
  PlaywrightWorkerOptions;

/**
 * The data source settings
 */
export interface DataSourceSettings<T = {}, S = {}> {
  id: number;
  editable?: boolean;
  uid: string;
  orgId?: number;
  name: string;
  type: string;
  access?: string;
  url?: string;
  database?: string;
  isDefault?: boolean;
  jsonData: T;
  secureJsonData?: S;
}

/**
 * The dashboard object
 */
export interface Dashboard {
  uid: string;
  title?: string;
}

export type CreateUserArgs = {
  /**
   * The username of the user to create. Needs to be unique
   */
  user: string;
  /**
   * The password of the user to create
   */
  password: string;
  /**
   * The role of the user to create
   */
  role?: OrgRole;
};

export type CreateDataSourceArgs<T = any> = {
  /**
   * The data source to create
   */
  id?: number;
  editable?: boolean;
  uid?: string;
  orgId?: number;
  name?: string;
  type: string;
  access?: string;
  url?: string;
  database?: string;
  isDefault?: boolean;
  jsonData?: T;
  secureJsonData?: T;
};

export type CreateDataSourcePageArgs = {
  /**
   * The data source type to create. This corresponds to the unique id of the data source plugin (`id` in `plugin.json`).
   */
  type: string;
  /**
   * The data source name to create
   */
  name?: string;

  /**
   * Set this to false to delete the data source via Grafana API after the test. Defaults to true.
   */
  deleteDataSourceAfterTest?: boolean;
};

export interface TimeRangeArgs {
  /**
   * The from time
   * @example 'now-6h'
   * @example '2020-01-01 00:00:00'
   */
  from: string;
  /**
   * The to time
   * @example 'now'
   * @example '2020-01-01 00:00:00'
   */
  to: string;
  /**
   * The time zone
   * @example 'utc'
   * @example 'browser'
   */
  zone?: string;
}

export type DashboardPageArgs = {
  /**
   * The uid of the dashboard to go to
   */
  uid?: string;
  /**
   * The time range to set
   */
  timeRange?: TimeRangeArgs;
  /**
   * Query parameters to add to the url
   */
  queryParams?: URLSearchParams;
};

/**
 * DashboardEditViewArgs is used to pass arguments to the page object models that represent a dashboard edit view,
 * such as {@link PanelEditPage}, {@link VariableEditPage} and {@link AnnotationEditPage}.
 *
 * If dashboard is not specified, it's assumed that it's a new dashboard. Otherwise, the dashboard uid is used to
 * navigate to an already existing dashboard.
 */
export type DashboardEditViewArgs<T> = {
  dashboard?: DashboardPageArgs;
  id: T;
};

export type ReadProvisionedDashboardArgs = {
  /**
   * The path, relative to the provisioning folder, to the dashboard json file
   */
  fileName: string;
};

export type ReadProvisionedDataSourceArgs = {
  /**
   * The path, relative to the provisioning folder, to the dashboard json file
   */
  fileName: string;

  /**
   * The name of the data source in the datasources list
   */
  name?: string;
};

export type PluginPageArgs = {
  pluginId: string;
};

export type GotoAppConfigPageArgs = PluginPageArgs;

export type GotoAppPageArgs = PluginPageArgs & {
  path?: string;
};

export type RequestOptions = {
  /**
   * Maximum wait time in milliseconds, defaults to 30 seconds, pass `0` to disable the timeout. The default value can
   * be changed by using the
   * [browserContext.setDefaultTimeout(timeout)](https://playwright.dev/docs/api/class-browsercontext#browser-context-set-default-timeout)
   * or [page.setDefaultTimeout(timeout)](https://playwright.dev/docs/api/class-page#page-set-default-timeout) methods.
   */
  timeout?: number;

  waitForResponsePredicateCallback?: string | RegExp | ((response: Response) => boolean | Promise<boolean>);
};

export type NavigateOptions = {
  /**
   * Referer header value.
   */
  referer?: string;

  /**
   * Maximum operation time in milliseconds. Defaults to `0` - no timeout.
   */
  timeout?: number;

  /**
   * When to consider operation succeeded, defaults to `load`. Events can be either:
   * - `'domcontentloaded'` - consider operation to be finished when the `DOMContentLoaded` event is fired.
   * - `'load'` - consider operation to be finished when the `load` event is fired.
   * - `'networkidle'` - **DISCOURAGED** consider operation to be finished when there are no network connections for
   *   at least `500` ms. Don't use this method for testing, rely on web assertions to assess readiness instead.
   * - `'commit'` - consider operation to be finished when network response is received and the document started
   *   loading.
   */
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';

  /**
   * Query parameters to add to the url. Optional
   */
  queryParams?: URLSearchParams;
};

export type AppPageNavigateOptions = NavigateOptions & {
  path?: string;
};

export type getByGrafanaSelectorOptions = {
  /**
   *Optional root locator to search within. If no locator is provided, the page will be used
   */
  root?: Locator;

  /**
   * Set to true to find locator that resolves elements that starts with a given string
   * Defaults to false
   */
  startsWith?: boolean;
};

export type TriggerRequestOptions = {
  /**
   * The path to the endpoint to trigger
   */
  path?: string;
};

export interface ContainTextOptions {
  /**
   * Whether to perform case-insensitive match. `ignoreCase` option takes precedence over the corresponding regular
   * expression flag if specified.
   */
  ignoreCase?: boolean;

  /**
   * Time to retry the assertion for in milliseconds. Defaults to `timeout` in `TestConfig.expect`.
   */
  timeout?: number;

  /**
   * Whether to use `element.innerText` instead of `element.textContent` when retrieving DOM node text.
   */
  useInnerText?: boolean;
}

export interface AlertPageOptions {
  /**
   * Maximum wait time in milliseconds, defaults to 30 seconds, pass `0` to disable the timeout. The default value can
   * be changed by using the
   * [browserContext.setDefaultTimeout(timeout)](https://playwright.dev/docs/api/class-browsercontext#browser-context-set-default-timeout)
   * or [page.setDefaultTimeout(timeout)](https://playwright.dev/docs/api/class-page#page-set-default-timeout) methods.
   */
  timeout?: number;
  /**
   * Matches elements containing an element that matches an inner locator. Inner locator is queried against the outer
   * one. For example, `article` that has `text=Playwright` matches `<article><div>Playwright</div></article>`.
   *
   * Note that outer and inner locators must belong to the same frame. Inner locator must not contain {@link
   * FrameLocator}s.
   */
  has?: Locator;

  /**
   * Matches elements that do not contain an element that matches an inner locator. Inner locator is queried against the
   * outer one. For example, `article` that does not have `div` matches `<article><span>Playwright</span></article>`.
   *
   * Note that outer and inner locators must belong to the same frame. Inner locator must not contain {@link
   * FrameLocator}s.
   */
  hasNot?: Locator;

  /**
   * Matches elements that do not contain specified text somewhere inside, possibly in a child or a descendant element.
   * When passed a [string], matching is case-insensitive and searches for a substring.
   */
  hasNotText?: string | RegExp;

  /**
   * Matches elements containing specified text somewhere inside, possibly in a child or a descendant element. When
   * passed a [string], matching is case-insensitive and searches for a substring. For example, `"Playwright"` matches
   * `<article><div>Playwright</div></article>`.
   */
  hasText?: string | RegExp;
}

export type OrgRole = 'None' | 'Viewer' | 'Editor' | 'Admin';

/**
 * Panel visualization types
 */
export type Visualization =
  | 'Alert list'
  | 'Bar gauge'
  | 'Clock'
  | 'Dashboard list'
  | 'Gauge'
  | 'Graph'
  | 'Heatmap'
  | 'Logs'
  | 'News'
  | 'Pie Chart'
  | 'Plugin list'
  | 'Polystat'
  | 'Stat'
  | 'Table'
  | 'Text'
  | 'Time series'
  | 'Worldmap Panel';

export type AlertVariant = 'success' | 'warning' | 'error' | 'info';
