import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../types';
import { VariableEditPage, VariablePage } from '../models';
import { PlaywrightCombinedArgs } from './types';

type VariableEditPageFixture = TestFixture<VariableEditPage, PluginFixture & PluginOptions & PlaywrightCombinedArgs>;

export const variableEditPage: VariableEditPageFixture = async (
  { page, selectors, grafanaVersion, request },
  use,
  testInfo
) => {
  const variablePage = new VariablePage({ page, selectors, grafanaVersion, request, testInfo });
  await variablePage.goto();
  const variableEditPage = await variablePage.clickAddNew();
  await use(variableEditPage);
};
