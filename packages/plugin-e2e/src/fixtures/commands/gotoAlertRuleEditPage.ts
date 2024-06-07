import * as semver from 'semver';
import { TestFixture } from '@playwright/test';
import { AlertRuleArgs, PlaywrightArgs } from '../../types';
import { AlertRuleEditPage } from '../../models/pages/AlertRuleEditPage';

type GotoAlertRuleEditPageFixture = TestFixture<(args: AlertRuleArgs) => Promise<AlertRuleEditPage>, PlaywrightArgs>;

export const gotoAlertRuleEditPage: GotoAlertRuleEditPageFixture = async (
  { request, page, selectors, grafanaVersion },
  use,
  testInfo
) => {
  await use(async (args) => {
    if (semver.lt(grafanaVersion, '9.5.0')) {
      console.log(
        'Testing alert rules with plugin-e2e is only supported for Grafana 9.4.0 and later. Checkout https://grafana.com/developers/plugin-tools/e2e-test-a-plugin/test-a-data-source-plugin/annotation-queries#test-the-entire-annotation-query-execution-flow to see how to skip tests for a range of Grafana versions.'
      );
    }
    const alertRuleEditPage = new AlertRuleEditPage({ page, selectors, grafanaVersion, request, testInfo }, args);
    await alertRuleEditPage.goto();
    return alertRuleEditPage;
  });
};
