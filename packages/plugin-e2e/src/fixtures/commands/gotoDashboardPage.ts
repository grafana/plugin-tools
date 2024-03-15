import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../../api';
import { DashboardPageArgs } from '../../types';
import { PlaywrightCombinedArgs } from '../types';
import { DashboardPage } from '../../models';

type GotoDashboardFixture = TestFixture<
  (args: DashboardPageArgs) => Promise<DashboardPage>,
  PluginFixture & PluginOptions & PlaywrightCombinedArgs
>;

const gotoDashboardPage: GotoDashboardFixture = async ({ request, page, selectors, grafanaVersion }, use, testInfo) => {
  await use(async (args) => {
    const dashboardPage = new DashboardPage({ page, selectors, grafanaVersion, request, testInfo }, args);
    await dashboardPage.goto();
    return dashboardPage;
  });
};

export default gotoDashboardPage;
