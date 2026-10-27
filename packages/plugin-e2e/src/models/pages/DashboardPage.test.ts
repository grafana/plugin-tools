import { describe, it, expect, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';
import { E2ESelectorGroups, PluginTestCtx } from '../../types';
import { resolveSelectors, versionedComponents, versionedPages } from '../../selectors/vendored';
import { versionedConstants } from '../../selectors/versionedConstants';
import { versionedAPIs } from '../../selectors/versionedAPIs';
import { resolveGrafanaSelector } from '../utils';

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

const ADD_PANEL_GRAFANA_VERSION = '13.2.0';

interface FakeLocator {
  isVisible: ReturnType<typeof vi.fn>;
  click: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  last: () => FakeLocator;
  locator: () => FakeLocator;
  getByRole: () => FakeLocator;
}

function resolveSelectorGroups(grafanaVersion: string): E2ESelectorGroups {
  return {
    components: resolveSelectors(versionedComponents, grafanaVersion),
    pages: resolveSelectors(versionedPages, grafanaVersion),
    constants: resolveSelectors(versionedConstants, grafanaVersion),
    apis: resolveSelectors(versionedAPIs, grafanaVersion),
  };
}

/**
 * Stands in for a Playwright Page on a new dashboard. `visibleSelectors` decides which elements
 * report as visible and can be mutated mid-test to simulate the layout rendering late. Boot data
 * reports `bootDataNewLayouts` so tests can prove addPanel follows the page, not the toggle.
 */
function createAddPanelHarness(options: { visibleSelectors: Set<string>; bootDataNewLayouts: boolean }) {
  const selectors = resolveSelectorGroups(ADD_PANEL_GRAFANA_VERSION);
  const { components, pages, constants } = selectors;
  const locators = new Map<string, FakeLocator>();

  function getLocator(selector: string): FakeLocator {
    const existing = locators.get(selector);
    if (existing) {
      return existing;
    }
    const fakeLocator: FakeLocator = {
      isVisible: vi.fn(async () => options.visibleSelectors.has(selector)),
      click: vi.fn(async () => {}),
      count: vi.fn(async () => 0),
      last: () => fakeLocator,
      locator: () => fakeLocator,
      getByRole: () => fakeLocator,
    };
    locators.set(selector, fakeLocator);
    return fakeLocator;
  }

  const page = {
    locator: vi.fn((selector: string) => getLocator(selector)),
    viewportSize: vi.fn(() => ({ width: 1280, height: 720 })),
    waitForSelector: vi.fn(async () => {}),
    waitForFunction: vi.fn(async () => ({
      jsonValue: async () => ({ dashboardNewLayouts: options.bootDataNewLayouts }),
    })),
    evaluate: vi.fn(async () => '1'),
  };

  const ctx = { page, grafanaVersion: ADD_PANEL_GRAFANA_VERSION, selectors } as unknown as PluginTestCtx;
  const toolbarAddSelector = resolveGrafanaSelector(
    components.PageToolbar.itemButton(constants.PageToolBar.itemButtonTitle)
  );

  return {
    dashboardPage: new DashboardPage(ctx),
    sidebarSelector: resolveGrafanaSelector(components.Sidebar.container),
    sidebarNewPanelSelector: resolveGrafanaSelector(components.Sidebar.newPanelButton),
    toolbarAddSelector,
    sidebarNewPanel: getLocator(resolveGrafanaSelector(components.Sidebar.newPanelButton)),
    sidebarConfigure: getLocator(resolveGrafanaSelector(components.Sidebar.configurePanelButton)),
    toolbarAdd: getLocator(toolbarAddSelector),
    toolbarAddViz: getLocator(
      resolveGrafanaSelector(pages.AddDashboard.itemButton(pages.AddDashboard.itemButtonAddViz))
    ),
  };
}

describe('DashboardPage.addPanel layout detection', () => {
  // Grafana 13.3 reads dashboardNewLayouts through OpenFeature, so boot data can say the toggle is
  // off while the sidebar is what renders (grafana/plugin-tools#3016).
  it('uses the sidebar flow when the sidebar renders, even if boot data reports the toggle off', async () => {
    const visibleSelectors = new Set<string>();
    const harness = createAddPanelHarness({ visibleSelectors, bootDataNewLayouts: false });
    visibleSelectors.add(harness.sidebarSelector);
    visibleSelectors.add(harness.sidebarNewPanelSelector);

    await harness.dashboardPage.addPanel();

    expect(harness.sidebarNewPanel.click).toHaveBeenCalledTimes(1);
    expect(harness.sidebarConfigure.click).toHaveBeenCalledTimes(1);
    expect(harness.toolbarAdd.click).not.toHaveBeenCalled();
  });

  it('uses the toolbar flow when the Add button renders, even if boot data reports the toggle on', async () => {
    const visibleSelectors = new Set<string>();
    const harness = createAddPanelHarness({ visibleSelectors, bootDataNewLayouts: true });
    visibleSelectors.add(harness.toolbarAddSelector);

    await harness.dashboardPage.addPanel();

    expect(harness.toolbarAdd.click).toHaveBeenCalledTimes(1);
    expect(harness.toolbarAddViz.click).toHaveBeenCalledTimes(1);
    expect(harness.sidebarNewPanel.click).not.toHaveBeenCalled();
  });

  it('waits for the layout to render before choosing a flow', async () => {
    const visibleSelectors = new Set<string>();
    const harness = createAddPanelHarness({ visibleSelectors, bootDataNewLayouts: false });
    setTimeout(() => visibleSelectors.add(harness.sidebarSelector), 300);

    await harness.dashboardPage.addPanel();

    expect(harness.sidebarConfigure.click).toHaveBeenCalledTimes(1);
    expect(harness.toolbarAdd.click).not.toHaveBeenCalled();
  });
});
