import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../../api';
import { PluginConfigPageArgs } from '../../types';
import { PlaywrightCombinedArgs } from '../types';
import { AppConfigPage } from '../../models/pages/AppConfigPage';

type CreateAPPConfigPageFixture = TestFixture<
  (args: PluginConfigPageArgs) => Promise<AppConfigPage>,
  PluginFixture & PluginOptions & PlaywrightCombinedArgs
>;

export const createAppConfigPage: CreateAPPConfigPageFixture = async (ctx, use) => {
  await use(async (args) => {
    const page = new AppConfigPage(ctx, args);
    await page.goto();
    return page;
  });
};
