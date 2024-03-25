import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../types';
import { DashboardPage } from '../models';
import { PlaywrightCombinedArgs } from './types';

type DashboardPageFixture = TestFixture<DashboardPage, PluginFixture & PluginOptions & PlaywrightCombinedArgs>;

export const dashboardPage: DashboardPageFixture = async (
  { page, request, selectors, grafanaVersion },
  use,
  testInfo
) => {
  const dashboardPage = new DashboardPage({ page, selectors, grafanaVersion, request, testInfo });
  await dashboardPage.goto();
  await use(dashboardPage);
};
