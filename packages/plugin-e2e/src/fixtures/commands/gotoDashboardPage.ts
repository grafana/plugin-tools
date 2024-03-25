import { TestFixture } from '@playwright/test';
import { DashboardPageArgs, PlaywrightArgs } from '../../types';
import { DashboardPage } from '../../models/pages/DashboardPage';

type GotoDashboardFixture = TestFixture<(args: DashboardPageArgs) => Promise<DashboardPage>, PlaywrightArgs>;

export const gotoDashboardPage: GotoDashboardFixture = async (
  { request, page, selectors, grafanaVersion },
  use,
  testInfo
) => {
  await use(async (args) => {
    const dashboardPage = new DashboardPage({ page, selectors, grafanaVersion, request, testInfo }, args);
    await dashboardPage.goto();
    return dashboardPage;
  });
};
