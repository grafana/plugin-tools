import { TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../types';
import { PanelEditPage } from '../models/pages/PanelEditPage';

type PanelEditPageFixture = TestFixture<PanelEditPage, PlaywrightArgs>;

export const panelEditPage: PanelEditPageFixture = async ({ dashboardPage }, use) => {
  const panelEditPage = await dashboardPage.addPanel();
  await use(panelEditPage);
};
