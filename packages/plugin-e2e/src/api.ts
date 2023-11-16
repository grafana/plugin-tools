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
};

// extend Playwright with Grafana plugin specific fixtures
export const test = base.extend<PluginFixture & PluginOptions>(fixtures);

export { selectors, expect } from '@playwright/test';
