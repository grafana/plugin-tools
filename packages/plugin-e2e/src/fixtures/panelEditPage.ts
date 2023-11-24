import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../api';
import { PanelEditPage } from '../models';
import { PlaywrightCombinedArgs } from './types';

type PanelEditPageFixture = TestFixture<PanelEditPage, PluginFixture & PluginOptions & PlaywrightCombinedArgs>;

const panelEditPage: PanelEditPageFixture = async ({ newDashboardPage }, use) => {
  const panelEditPage = await newDashboardPage.addPanel();
  await use(panelEditPage);
};

export default panelEditPage;
