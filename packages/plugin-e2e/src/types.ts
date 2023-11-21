import { Locator, PlaywrightTestArgs } from '@playwright/test';

import { E2ESelectors } from './e2e-selectors/types';

/**
 * The context object passed to page object models
 */
export type PluginTestCtx = { grafanaVersion: string; selectors: E2ESelectors } & Pick<
  PlaywrightTestArgs,
  'page' | 'request'
>;

/**
 * The data source object
 */
export interface DataSource<T = any> {
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
}

/**
 * The YAML provision file parsed to a javascript object
 */
export type ProvisionFile<T = DataSource> = {
  datasources: Array<DataSource<T>>;
};

export type CreateDataSourceArgs = {
  /**
   * The data source to create
   */
  datasource: DataSource;
};

export type CreateDataSourcePageArgs = {
  /**
   * The data source type to create
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

export type RequestOptions = {
  /**
   * Maximum wait time in milliseconds, defaults to 30 seconds, pass `0` to disable the timeout. The default value can
   * be changed by using the
   * [browserContext.setDefaultTimeout(timeout)](https://playwright.dev/docs/api/class-browsercontext#browser-context-set-default-timeout)
   * or [page.setDefaultTimeout(timeout)](https://playwright.dev/docs/api/class-page#page-set-default-timeout) methods.
   */
  timeout?: number;
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

export type GotoDashboardArgs = {
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

export type ReadProvisionArgs = {
  /**
   * The path, relative to the provisioning folder, to the dashboard json file
   */
  filePath: string;
};

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

/**
 * Implement this interface in a POM in case you want to enable the `toHavePanelError` matcher for the page.
 * Only applicable to pages that have one panel only, such as the explore page or panel edit page.
 *
 * @internal
 */
export interface PanelError {
  ctx: PluginTestCtx;
  getPanelError: () => Locator;
}
