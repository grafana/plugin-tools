import { TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../types';
import { VariablePage } from '../models/pages/VariablePage';

type VariablePageFixture = TestFixture<VariablePage, PlaywrightArgs>;

export const variablePage: VariablePageFixture = async (
  { page, selectors, grafanaVersion, request },
  use,
  testInfo
) => {
  const variablePage = new VariablePage({ page, selectors, grafanaVersion, request, testInfo });
  await variablePage.goto();
  await use(variablePage);
};
