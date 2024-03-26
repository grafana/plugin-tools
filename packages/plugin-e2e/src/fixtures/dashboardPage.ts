import { TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../types';
import { DashboardPage } from '../models/pages/DashboardPage';

type DashboardPageFixture = TestFixture<DashboardPage, PlaywrightArgs>;

export const dashboardPage: DashboardPageFixture = async (
  { page, request, selectors, grafanaVersion },
  use,
  testInfo
) => {
  const dashboardPage = new DashboardPage({ page, selectors, grafanaVersion, request, testInfo });
  await dashboardPage.goto();
  await use(dashboardPage);
};
