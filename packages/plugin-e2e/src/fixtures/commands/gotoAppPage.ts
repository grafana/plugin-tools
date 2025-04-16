import { TestFixture } from '@playwright/test';
import { GotoAppPageArgs, PlaywrightArgs } from '../../types';
import { AppPage } from '../../models/pages/AppPage';

type GotoAppPageFixture = TestFixture<(args: GotoAppPageArgs) => Promise<AppPage>, PlaywrightArgs>;

export const gotoAppPage: GotoAppPageFixture = async ({ page, selectors, grafanaVersion, request }, use, testInfo) => {
  await use(async ({ pluginId, path }) => {
    const appPage = new AppPage({ page, selectors, grafanaVersion, request, testInfo }, { pluginId });
    await appPage.goto({ path });
    return appPage;
  });
};
