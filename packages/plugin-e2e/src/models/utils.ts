import { Locator, Page } from '@playwright/test';
import { getByGrafanaSelectorOptions, PluginTestCtx } from '../types';

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
  selector: string,
  options: Omit<getByGrafanaSelectorOptions, 'root'> & { root: Locator | Page }
): Locator {
  const startsWith = options.startsWith ? '^' : '';
  if (selector.startsWith('data-testid')) {
    return options.root.locator(`[data-testid${startsWith}="${selector}"]`);
  }

  return options.root.locator(`[aria-label${startsWith}="${selector}"]`);
}
