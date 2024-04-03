import { expect } from '@playwright/test';
import { getMessage } from './utils';
import { ContainTextOptions } from '../types';
import { VariableEditPage } from '../models/pages/VariableEditPage';

export const toDisplayPreviews = async (
  variableEditPage: VariableEditPage,
  previewTexts: Array<string | RegExp>,
  options?: ContainTextOptions
) => {
  let pass = false;
  let actual;
  let message = `To find preview of values: ${previewTexts.join(', ')}}`;

  try {
    await expect(
      variableEditPage.getByGrafanaSelector(
        variableEditPage.ctx.selectors.pages.Dashboard.Settings.Variables.Edit.General.previewOfValuesOption
      )
    ).toContainText(previewTexts, options);
    return {
      pass: true,
      actual: false,
      message: () => message,
    };
  } catch (err: unknown) {
    return {
      message: () => getMessage(message, err instanceof Error ? err.toString() : 'Unknown error'),
      pass,
      actual,
    };
  }
};
