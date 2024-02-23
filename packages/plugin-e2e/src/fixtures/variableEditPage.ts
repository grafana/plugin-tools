import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../api';
import { VariableEditPage, VariablePage } from '../models';
import { PlaywrightCombinedArgs } from './types';

type VariableEditPageFixture = TestFixture<VariableEditPage, PluginFixture & PluginOptions & PlaywrightCombinedArgs>;

const variableEditPage: VariableEditPageFixture = async ({ page, selectors, grafanaVersion, request }, use) => {
  const variablePage = new VariablePage({ page, selectors, grafanaVersion, request });
  await variablePage.goto();
  const variableEditPage = await variablePage.clickAddNew();
  await use(variableEditPage);
};

export default variableEditPage;
