import { TestFixture } from '@playwright/test';
import { DashboardEditViewArgs, PlaywrightArgs } from '../../types';
import { PanelEditPage } from '../../models/pages/PanelEditPage';

type GotoPanelEditPageFixture = TestFixture<
  (args: DashboardEditViewArgs<string>) => Promise<PanelEditPage>,
  PlaywrightArgs
>;

export const gotoPanelEditPage: GotoPanelEditPageFixture = async (
  { request, page, selectors, grafanaVersion },
  use,
  testInfo
) => {
  await use(async (args) => {
    const panelEditPage = new PanelEditPage({ page, selectors, grafanaVersion, request, testInfo }, args);
    await panelEditPage.goto();
    return panelEditPage;
  });
};
