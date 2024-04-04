import { TestFixture } from '@playwright/test';
import { GotoAppConfigPageArgs, PlaywrightArgs } from '../../types';
import { AppConfigPage } from '../../models/pages/AppConfigPage';

type GotoAppConfigPageFixture = TestFixture<(args: GotoAppConfigPageArgs) => Promise<AppConfigPage>, PlaywrightArgs>;

export const gotoAppConfigPage: GotoAppConfigPageFixture = async (
  { page, selectors, grafanaVersion, request },
  use,
  testInfo
) => {
  await use(async (args) => {
    const appConfigPage = new AppConfigPage({ page, selectors, grafanaVersion, request, testInfo }, args);
    await appConfigPage.goto();
    return appConfigPage;
  });
};
