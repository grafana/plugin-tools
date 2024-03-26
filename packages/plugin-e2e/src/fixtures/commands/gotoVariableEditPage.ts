import { TestFixture } from '@playwright/test';
import { DashboardEditViewArgs, PlaywrightArgs } from '../../types';
import { VariableEditPage } from '../../models/pages/VariableEditPage';

type GotoVariableEditPageFixture = TestFixture<
  (args: DashboardEditViewArgs<string>) => Promise<VariableEditPage>,
  PlaywrightArgs
>;

export const gotoVariableEditPage: GotoVariableEditPageFixture = async (
  { request, page, selectors, grafanaVersion },
  use,
  testInfo
) => {
  await use(async (args) => {
    const variableEditPage = new VariableEditPage({ page, selectors, grafanaVersion, request, testInfo }, args);
    await variableEditPage.goto();
    return variableEditPage;
  });
};
