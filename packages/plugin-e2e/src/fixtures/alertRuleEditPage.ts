import * as semver from 'semver';
import { TestFixture } from '@playwright/test';
import { AlertRuleEditPage } from '../models/pages/AlertRuleEditPage';
import { PlaywrightArgs } from '../types';

type AlertRuleEditPageFixture = TestFixture<AlertRuleEditPage, PlaywrightArgs>;

export const alertRuleEditPage: AlertRuleEditPageFixture = async (
  { page, selectors, grafanaVersion, request },
  use,
  testInfo
) => {
  if (semver.lt(grafanaVersion, '9.5.0')) {
    console.log(
      'Testing alert rules with plugin-e2e is only supported for Grafana 9.5.0 and later. Checkout https://grafana.com/developers/plugin-tools/e2e-test-a-plugin/test-a-data-source-plugin/annotation-queries#test-the-entire-annotation-query-execution-flow to see how to skip tests for a range of Grafana versions.'
    );
  }
  const alertRuleEditPage = new AlertRuleEditPage({ page, selectors, grafanaVersion, request, testInfo });
  await alertRuleEditPage.goto();
  await use(alertRuleEditPage);
};
