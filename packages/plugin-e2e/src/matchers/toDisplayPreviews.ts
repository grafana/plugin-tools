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

  const { Edit } = variableEditPage.ctx.selectors.pages.Dashboard.Settings.Variables;
  const previewLabels = variableEditPage.getByGrafanaSelector(Edit.General.previewOfValuesOption);
  // since Grafana 13.1.0, options carrying additional properties (any data frame field
  // not named "value" or "text") are previewed in a table instead of a list of labels
  const previewTable = variableEditPage.getByGrafanaSelector(Edit.CustomVariable.previewTable);

  try {
    await expect(previewLabels.or(previewTable).first()).toBeVisible({ timeout: options?.timeout });

    if (await previewTable.isVisible()) {
      const headerTexts = await previewTable.locator('thead th').allInnerTexts();
      // the "text" column holds the display text of each option, matching what the labels used to show
      const textColumnIndex = headerTexts.findIndex((headerText) => headerText.trim() === 'text');
      // fall back to the third column (expander, value, text) if the header is not found
      const textCellSelector = `tbody tr td:nth-child(${textColumnIndex === -1 ? 3 : textColumnIndex + 1})`;
      const textCells = previewTable.locator(textCellSelector);
      await expect(textCells).toContainText(previewTexts, options);
    } else {
      await expect(previewLabels).toContainText(previewTexts, options);
    }

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
