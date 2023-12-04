import { TestFixture, expect } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../api';
import { DashboardPage } from '../models';
import { PlaywrightCombinedArgs } from './types';

type NewDashboardPageFixture = TestFixture<DashboardPage, PluginFixture & PluginOptions & PlaywrightCombinedArgs>;

const newDashboardPage: NewDashboardPageFixture = async ({ page, request, selectors, grafanaVersion }, use) => {
  const newDashboardPage = new DashboardPage({ page, selectors, grafanaVersion, request }, expect);
  await newDashboardPage.goto();
  await use(newDashboardPage);
};

export default newDashboardPage;
