import { TestFixture } from '@playwright/test';
import { AlertRuleEditPage } from '../models/pages/AlertRuleEditPage';
import { PlaywrightArgs } from '../types';

type AlertRuleEditPageFixture = TestFixture<AlertRuleEditPage, PlaywrightArgs>;

export const alertRuleEditPage: AlertRuleEditPageFixture = async (
  { page, selectors, grafanaVersion, request },
  use,
  testInfo
) => {
  const alertRuleEditPage = new AlertRuleEditPage({ page, selectors, grafanaVersion, request, testInfo });
  await alertRuleEditPage.goto();
  await use(alertRuleEditPage);
};
