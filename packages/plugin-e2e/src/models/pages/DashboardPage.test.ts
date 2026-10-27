import { describe, it, expect, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';
import { PluginTestCtx } from '../../types';

const NAV_TOOLBAR = 'data-testid Nav toolbar';
const DASHBOARD_CONTROLS = 'data-testid dashboard controls';

/**
 * Returns the selector `toolbar` passes to `page.locator`, by standing in a locator factory that
 * hands back the selector it was given.
 */
function resolveToolbarSelector(grafanaVersion: string): string {
  const ctx = {
    page: { locator: vi.fn((selector: string) => selector) },
    grafanaVersion,
    selectors: {
      components: { NavToolbar: { container: NAV_TOOLBAR } },
      pages: { Dashboard: { Controls: DASHBOARD_CONTROLS } },
    },
  } as unknown as PluginTestCtx;

  return new DashboardPage(ctx).toolbar as unknown as string;
}

describe('DashboardPage.toolbar', () => {
  // Each threshold is the version at which that toolbar became the default, not the version at
  // which its selector first existed. Both toolbars shipped behind a feature toggle that stayed
  // off by default for two more minor releases, so gating on first availability resolved to an
  // element Grafana never renders, and a scoped locator then waited out the whole test timeout.
  it.each([
    ['8.5.27', '.page-toolbar'],
    // topnav exists from 9.4.0 but is only default-on from 9.5.0
    ['9.4.17', '.page-toolbar'],
    ['9.5.0', `[data-testid="${NAV_TOOLBAR}"]`],
    ['11.0.11', `[data-testid="${NAV_TOOLBAR}"]`],
    // dashboardScene exists from 11.1.0 but is only default-on from 11.3.0
    ['11.1.13', `[data-testid="${NAV_TOOLBAR}"]`],
    ['11.2.10', `[data-testid="${NAV_TOOLBAR}"]`],
    ['11.3.0', `[data-testid="${DASHBOARD_CONTROLS}"]`],
    ['13.2.0', `[data-testid="${DASHBOARD_CONTROLS}"]`],
  ])('resolves the toolbar on Grafana %s to %s', (grafanaVersion, expected) => {
    expect(resolveToolbarSelector(grafanaVersion)).toBe(expected);
  });
});
