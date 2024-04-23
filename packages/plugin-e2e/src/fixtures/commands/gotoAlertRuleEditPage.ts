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
    const alertRuleEditPage = new AlertRuleEditPage({ page, selectors, grafanaVersion, request, testInfo }, args);
    await alertRuleEditPage.goto();
    return alertRuleEditPage;
  });
};
