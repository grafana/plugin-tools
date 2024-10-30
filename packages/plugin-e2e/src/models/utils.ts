import { Locator, Page } from '@playwright/test';
import { getByGrafanaSelectorOptions } from '../types';

export const radioButtonSetChecked = async (
  page: Page,
  label: string,
  checked: boolean,
  options?: { exact?: boolean }
) => {
  try {
    await page.getByLabel(label, options).setChecked(checked, { timeout: 1000 });
  } catch (_) {
    await page.getByText(label, options).setChecked(checked);
  }
};

export function getByGrafanaSelector(
  locator: Page['locator'],
  selector: string,
  options?: getByGrafanaSelectorOptions
): Locator {
  const startsWith = options?.startsWith ? '^' : '';
  if (selector.startsWith('data-testid')) {
    return locator(`[data-testid${startsWith}="${selector}"]`);
  }

  return locator(`[aria-label${startsWith}="${selector}"]`);
}
