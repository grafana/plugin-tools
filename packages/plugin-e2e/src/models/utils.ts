import { Page } from '@playwright/test';
import { getByGrafanaSelectorOptions, PluginTestCtx } from '../types';

type PanelActionsPopoverNames = PluginTestCtx['selectors']['constants']['PanelActionsPopover'];

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

export function resolveGrafanaSelector(selector: string, options?: Omit<getByGrafanaSelectorOptions, 'root'>): string {
  const startsWith = options?.startsWith ? '^' : '';
  if (selector.startsWith('data-testid')) {
    return `[data-testid${startsWith}="${selector}"]`;
  }
  return `[aria-label${startsWith}="${selector}"]`;
}

/**
 * Returns a pattern for the accessible name of the panel actions popover button that replaces the given panel menu
 * item, or undefined if the popover has no equivalent button.
 *
 * The pattern is anchored at the start because the button names end with keyboard shortcut hints, e.g. 'Edit (e)'.
 */
export function getPanelActionsPopoverButtonName(
  menuItem: string,
  names: PanelActionsPopoverNames
): RegExp | undefined {
  const buttonNamesByMenuItem = new Map([
    ['View', names.expandButton],
    ['Edit', names.editButton],
    ['Explore', names.exploreButton],
    ['Copy', names.copyButton],
    ['Duplicate', names.duplicateButton],
    ['Remove', names.removeButton],
  ]);
  const buttonName = buttonNamesByMenuItem.get(menuItem);
  if (!buttonName) {
    return undefined;
  }
  // (?!\w) instead of \b, so that names ending with punctuation still match
  return new RegExp(`^${buttonName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\w)`);
}
