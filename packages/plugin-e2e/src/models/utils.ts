import { Page } from '@playwright/test';
import { DashboardEditViewArgs, DashboardPageArgs, getByGrafanaSelectorOptions, PluginTestCtx } from '../types';
import { PanelEditPage } from './pages/PanelEditPage';
import { DashboardPage } from './pages/DashboardPage';

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

export function getPanelEditPage(ctx: PluginTestCtx, panelId?: string | null, dashboard?: DashboardPageArgs) {
  return new PanelEditPage(ctx, { dashboard, id: panelId ?? '1' });
}

export function getDashboardPage(ctx: PluginTestCtx, args: DashboardEditViewArgs<string>) {
  return new DashboardPage(ctx, args);
}
