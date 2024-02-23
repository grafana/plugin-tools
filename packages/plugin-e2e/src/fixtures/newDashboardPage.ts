import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../api';
import { DashboardPage } from '../models';
import { PlaywrightCombinedArgs } from './types';

type NewDashboardPageFixture = TestFixture<DashboardPage, PluginFixture & PluginOptions & PlaywrightCombinedArgs>;

const newDashboardPage: NewDashboardPageFixture = async (
  { page, request, selectors, grafanaVersion },
  use,
  testInfo
) => {
  const newDashboardPage = new DashboardPage({ page, selectors, grafanaVersion, request, testInfo });
  await newDashboardPage.goto();
  await use(newDashboardPage);
};

export default newDashboardPage;
