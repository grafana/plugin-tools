import { TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../types';
import { VariableEditPage, VariablePage } from '../models';

type VariableEditPageFixture = TestFixture<VariableEditPage, PlaywrightArgs>;

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
