import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../../api';
import { PluginConfigPageArgs } from '../../types';
import { PlaywrightCombinedArgs } from '../types';
import { AppConfigPage } from '../../models/pages/AppConfigPage';

type CreateAPPConfigPageFixture = TestFixture<
  (args: PluginConfigPageArgs) => Promise<AppConfigPage>,
  PluginFixture & PluginOptions & PlaywrightCombinedArgs
>;

export const createAppConfigPage: CreateAPPConfigPageFixture = async (
  { page, selectors, grafanaVersion, request },
  use
) => {
  await use(async (args) => {
    const appConfigPage = new AppConfigPage({ page, selectors, grafanaVersion, request }, args);
    await appConfigPage.goto();
    return appConfigPage;
  });
};
