import { Page } from '@playwright/test';

export const clickRadioButton = async (page: Page, label: string, options?: { exact?: boolean }) => {
  try {
    await page.getByLabel(label, options).click({ timeout: 1000 });
  } catch (_) {
    await page.getByText(label, options).click();
  }
};
