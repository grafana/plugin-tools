import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../api';
import { PlaywrightCombinedArgs } from './types';
import { AlertRuleEditPage } from '../models/pages/AlertRuleEditPage';

type AlertRuleEditPageFixture = TestFixture<AlertRuleEditPage, PluginFixture & PluginOptions & PlaywrightCombinedArgs>;

const alertRuleEditPage: AlertRuleEditPageFixture = async ({ page, selectors, grafanaVersion, request }, use) => {
  const alertRuleEditPage = new AlertRuleEditPage({ page, selectors, grafanaVersion, request });
  await alertRuleEditPage.goto();
  await use(alertRuleEditPage);
};

export default alertRuleEditPage;
