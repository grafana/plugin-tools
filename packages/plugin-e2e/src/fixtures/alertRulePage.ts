import { TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../types';
import { AlertRuleEditPage } from '../models/pages/AlertRuleEditPage';

type AlertRuleEditPageFixture = TestFixture<AlertRuleEditPage, PlaywrightArgs>;

export const alertRuleEditPage: AlertRuleEditPageFixture = async (
  { page, selectors, grafanaVersion, request },
  use,
  testInfo
) => {
  const alertRulePage = new AlertRuleEditPage({ page, selectors, grafanaVersion, request, testInfo });
  await alertRulePage.goto();
  await use(alertRulePage);
};
