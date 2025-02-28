import { TestFixture } from '@playwright/test';
import { DashboardPageArgs, PlaywrightArgs } from '../../types';
import { VariablePage } from '../../models/pages/VariablePage';

type GotoVariablePageFixture = TestFixture<(args: DashboardPageArgs) => Promise<VariablePage>, PlaywrightArgs>;

export const gotoVariablePage: GotoVariablePageFixture = async (
  { request, page, selectors, grafanaVersion },
  use,
  testInfo
) => {
  await use(async (args) => {
    const variablePage = new VariablePage({ page, selectors, grafanaVersion, request, testInfo }, args);
    await variablePage.goto();
    return variablePage;
  });
};
