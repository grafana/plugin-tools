import { test as base, expect as baseExpect } from '@playwright/test';

import { AlertPageOptions, AlertVariant, ContainTextOptions, PluginFixture, PluginOptions } from './types';
import { annotationEditPage } from './fixtures/annotationEditPage';
import { createDataSource } from './fixtures/commands/createDataSource';
import { createDataSourceConfigPage } from './fixtures/commands/createDataSourceConfigPage';
import { createUser } from './fixtures/commands/createUser';
import { gotoAnnotationEditPage } from './fixtures/commands/gotoAnnotationEditPage';
import { gotoAppConfigPage } from './fixtures/commands/gotoAppConfigPage';
import { gotoAppPage } from './fixtures/commands/gotoAppPage';
import { gotoDashboardPage } from './fixtures/commands/gotoDashboardPage';
import { gotoDataSourceConfigPage } from './fixtures/commands/gotoDataSourceConfigPage';
import { gotoPanelEditPage } from './fixtures/commands/gotoPanelEditPage';
import { gotoAlertRuleEditPage } from './fixtures/commands/gotoAlertRuleEditPage';
import { gotoVariableEditPage } from './fixtures/commands/gotoVariableEditPage';
import { login } from './fixtures/commands/login';
import { readProvisionedDashboard } from './fixtures/commands/readProvisionedDashboard';
import { readProvisionedDataSource } from './fixtures/commands/readProvisionedDataSource';
import { dashboardPage } from './fixtures/dashboardPage';
import { explorePage } from './fixtures/explorePage';
import { grafanaVersion } from './fixtures/grafanaVersion';
import { isFeatureToggleEnabled } from './fixtures/isFeatureToggleEnabled';
import { page } from './fixtures/page';
import { panelEditPage } from './fixtures/panelEditPage';
import { selectors as e2eSelectors } from './fixtures/selectors';
import { variableEditPage } from './fixtures/variableEditPage';
import { alertRuleEditPage } from './fixtures/alertRuleEditPage';
import { options } from './options';
import { toHaveAlert } from './matchers/toHaveAlert';
import { toDisplayPreviews } from './matchers/toDisplayPreviews';
import { toBeOK } from './matchers/toBeOK';
import { GrafanaPage } from './models/pages/GrafanaPage';
import { VariableEditPage } from './models/pages/VariableEditPage';

// models
export { DataSourcePicker } from './models/components/DataSourcePicker';
export { Panel } from './models/components/Panel';
export { TimeRange } from './models/components/TimeRange';
export { AnnotationEditPage } from './models/pages/AnnotationEditPage';
export { AnnotationPage } from './models/pages/AnnotationPage';
export { DashboardPage } from './models/pages/DashboardPage';
export { DataSourceConfigPage } from './models/pages/DataSourceConfigPage';
export { ExplorePage } from './models/pages/ExplorePage';
export { GrafanaPage } from './models/pages/GrafanaPage';
export { PanelEditPage } from './models/pages/PanelEditPage';
export { VariableEditPage } from './models/pages/VariableEditPage';
export { VariablePage } from './models/pages/VariablePage';
export { AppConfigPage } from './models/pages/AppConfigPage';
export { PluginConfigPage } from './models/pages/PluginConfigPage';
export { AppPage } from './models/pages/AppPage';

// e2e-selectors
export { Components, Pages, APIs, E2ESelectors } from './e2e-selectors/types';
export { resolveSelectors } from './e2e-selectors/resolver';

// types
export * from './types';

export const test = base.extend<PluginFixture, PluginOptions>({
  selectors: e2eSelectors,
  grafanaVersion,
  login,
  createDataSourceConfigPage,
  page,
  dashboardPage,
  panelEditPage,
  variableEditPage,
  annotationEditPage,
  alertRuleEditPage,
  explorePage,
  createDataSource,
  readProvisionedDataSource,
  readProvisionedDashboard,
  isFeatureToggleEnabled,
  createUser,
  gotoDashboardPage,
  gotoPanelEditPage,
  gotoVariableEditPage,
  gotoAnnotationEditPage,
  gotoAlertRuleEditPage,
  gotoDataSourceConfigPage,
  gotoAppConfigPage,
  gotoAppPage,
  ...options,
});

export const expect = baseExpect.extend({
  toHaveAlert,
  toDisplayPreviews,
  toBeOK,
});

export { selectors } from '@playwright/test';

declare global {
  interface Window {
    monaco: any;
    grafanaBootData: {
      settings: {
        featureToggles: Record<string, boolean>;
      };
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PlaywrightTest {
    const r: unique symbol;
    const t: unique symbol;
    interface Matchers<R, T> {
      [r]: R;
      [t]: T;

      /**
       * Await the response of a Playwright request and asserts the response was successful (status in the range 200-299).
       */
      toBeOK(this: Matchers<unknown, Promise<Response>>): R;

      /**
       * Asserts that preview text elements are displayed on the Variable Edit Page. You should make sure any variable queries are completed before calling this matcher.
       */
      toDisplayPreviews(
        this: Matchers<unknown, VariableEditPage>,
        previewTexts: Array<string | RegExp>,
        options: ContainTextOptions
      ): R;

      /**
       * Asserts that a GrafanaPage contains an alert with the specified severity. Use the options to specify the timeout and to filter the alerts.
       */
      toHaveAlert(this: Matchers<unknown, GrafanaPage>, severity: AlertVariant, options?: AlertPageOptions): R;
    }
  }
}
