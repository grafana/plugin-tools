import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../../api';
import { PlaywrightCombinedArgs } from '../types';
import { AppPage, GotoAppPageArgs } from '../..';

type GotoAppPageFixture = TestFixture<
  (args: GotoAppPageArgs) => Promise<AppPage>,
  PluginFixture & PluginOptions & PlaywrightCombinedArgs
>;

export const gotoAppPage: GotoAppPageFixture = async ({ page, selectors, grafanaVersion, request }, use, testInfo) => {
  await use(async ({ pluginId, path }) => {
    const appPage = new AppPage({ page, selectors, grafanaVersion, request, testInfo }, { pluginId });
    await appPage.goto({ path });
    return appPage;
  });
};

export default gotoAppPage;
