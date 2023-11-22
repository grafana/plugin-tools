import { expect } from '@playwright/test';
import { getMessage } from './utils';
import { VariableEditPage } from '../models';

const toDisplayPreviews = async (variableEditPage: VariableEditPage, previewTexts: Array<string | RegExp>) => {
  let pass = false;
  let actual;
  let message: any = `To find preview of values: ${previewTexts.join(', ')}}`;

  try {
    await expect(
      variableEditPage.getByTestIdOrAriaLabel(
        variableEditPage.ctx.selectors.pages.Dashboard.Settings.Variables.Edit.General.previewOfValuesOption
      )
    ).toContainText(previewTexts);
    return {
      pass: true,
      actual: false,
      message,
    };
  } catch (err: unknown) {
    return {
      message: () => getMessage(message, err instanceof Error ? err.toString() : 'Unknown error'),
      pass,
      actual,
    };
  }
};

export default toDisplayPreviews;
