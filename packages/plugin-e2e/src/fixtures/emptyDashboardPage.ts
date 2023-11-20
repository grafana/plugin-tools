import { TestFixture, expect } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../api';
import { EmptyDashboardPage } from '../models';
import { PlaywrightCombinedArgs } from './types';

type EmptyDashboardPageFixture = TestFixture<
  EmptyDashboardPage,
  PluginFixture & PluginOptions & PlaywrightCombinedArgs
>;

const emptyDashboardPage: EmptyDashboardPageFixture = async ({ page, request, selectors, grafanaVersion }, use) => {
  const emptyDashboardPage = new EmptyDashboardPage({ page, selectors, grafanaVersion, request }, expect);
  await emptyDashboardPage.goto();
  await use(emptyDashboardPage);
};

export default emptyDashboardPage;
