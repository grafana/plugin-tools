import { Page } from '@playwright/test';

export const radioButtonSetChecked = async (
  page: Page,
  label: string,
  checked: boolean,
  options?: { exact?: boolean }
) => {
  try {
    await page.getByLabel(label, options).setChecked(checked);
  } catch (_) {
    await page.getByText(label, options).setChecked(checked);
  }
};
