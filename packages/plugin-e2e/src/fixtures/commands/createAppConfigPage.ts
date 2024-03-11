import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../../api';
import { PluginConfigPageArgs } from '../../types';
import { PlaywrightCombinedArgs } from '../types';
import { AppConfigPage } from '../../models/pages/AppConfigPage';

type CreateAPPConfigPageFixture = TestFixture<
  (args: PluginConfigPageArgs, options?: { goto?: boolean }) => Promise<AppConfigPage>,
  PluginFixture & PluginOptions & PlaywrightCombinedArgs
>;

export const createAppConfigPage: CreateAPPConfigPageFixture = async (
  { page, selectors, grafanaVersion, request },
  use
) => {
  await use(async (args, options = { goto: true }) => {
    const appConfigPage = new AppConfigPage({ page, selectors, grafanaVersion, request }, args);
    if (options.goto) {
      await appConfigPage.goto();
    }
    return appConfigPage;
  });
};
