import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../types';
import { PanelEditPage } from '../models';
import { PlaywrightCombinedArgs } from './types';

type PanelEditPageFixture = TestFixture<PanelEditPage, PluginFixture & PluginOptions & PlaywrightCombinedArgs>;

export const panelEditPage: PanelEditPageFixture = async ({ dashboardPage }, use) => {
  const panelEditPage = await dashboardPage.addPanel();
  await use(panelEditPage);
};
