import { PlaywrightTestArgs } from '@playwright/test';

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
export interface DataSource {
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
  jsonData?: any;
  secureJsonData?: any;
}

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
};
