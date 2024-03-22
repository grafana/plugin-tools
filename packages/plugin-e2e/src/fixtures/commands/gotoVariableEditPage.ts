import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../../api';
import { DashboardEditViewArgs } from '../../types';
import { PlaywrightCombinedArgs } from '../types';
import { VariableEditPage } from '../../models';

type GotoVariableEditPageFixture = TestFixture<
  (args: DashboardEditViewArgs<string>) => Promise<VariableEditPage>,
  PluginFixture & PluginOptions & PlaywrightCombinedArgs
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
