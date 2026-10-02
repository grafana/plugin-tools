import { expect, Locator } from '@playwright/test';
import { lt } from '../../utils/version';
import { PluginTestCtx } from '../../types';
import { GrafanaPage } from '../pages/GrafanaPage';
import {
  E2E_DATA_PANEL_ID,
  E2E_DATA_PANEL_JSON_TESTID,
  E2E_DATA_PANEL_TESTID,
  GetPanelDataOptions,
  PanelData,
  parsePanelData,
} from './panelData';

const DEFAULT_PANEL_DATA_STATES = ['Done', 'Error'];

const ERROR_STATUS = 'error';

export class Panel extends GrafanaPage {
  constructor(
    readonly ctx: PluginTestCtx,
    readonly locator: Locator
  ) {
    super(ctx);
  }

  /**
   * Returns a locator that resolves element(s) that contain the field name(s) that are currently displayed in the panel.
   *
   * Can be used to assert the field names displayed in the panel visualization. e.g
   * await expect(panelEditPage.panel.fieldNames).toHaveValues(['Month', 'Stockholm', 'Berlin', 'Log Angeles']);
   */
  get fieldNames(): Locator {
    const panel = this.locator;
    return panel.locator('[role="columnheader"]');
  }

  /**
   * Returns a locator that resolves element(s) that contain the value(s) that are currently displayed in the panel.
   *
   * Can be used to assert the values displayed in the panel visualization. e.g
   * await expect(panelEditPage.panel.data).toContainText(['1', '4', '14']);
   */
  get data(): Locator {
    const panel = this.locator;
    if (lt(this.ctx.grafanaVersion, '12.2.0')) {
      return panel.locator('[role="cell"]');
    }

    return panel.locator('[role="gridcell"]');
  }

  /**
   * Click on a menu item in the panel menu.
   *
   * Pass options.parentItem to specify the parent item of the menu item to click.
   */
  async clickOnMenuItem(item: string, options?: { parentItem?: string }): Promise<void> {
    let panelMenu = this.getByGrafanaSelector(this.ctx.selectors.components.Panels.Panel.menu(''), {
      startsWith: true,
      root: this.locator,
    });
    let parentMenuItem = this.getByGrafanaSelector(
      this.ctx.selectors.components.Panels.Panel.menuItems(options?.parentItem ?? '')
    );
    let menuItem = this.getByGrafanaSelector(this.ctx.selectors.components.Panels.Panel.menuItems(item));

    // before 9.5.0, there were no proper selectors for the panel menu items
    if (lt(this.ctx.grafanaVersion, '9.5.0')) {
      panelMenu = this.locator.getByRole('heading');
      parentMenuItem = this.ctx.page.getByText(options?.parentItem ?? '');
      menuItem = this.ctx.page.getByRole('menu').getByText(item);
    }

    await panelMenu.click({ force: true });
    options?.parentItem && (await parentMenuItem.hover());
    await menuItem.click();
  }

  /**
   * Scrolls the panel into the viewport, triggering its query if not yet started.
   *
   * In Grafana 13.x+ with scenes, panels are lazy-rendered: the panel element does not
   * exist in the DOM until its grid container enters the viewport. This method scrolls
   * the page viewport-by-viewport until the panel element appears, then returns. The
   * 500ms pause per step gives IntersectionObserver time to fire and the VizPanel time
   * to mount before checking visibility.
   */
  async scrollIntoView(): Promise<void> {
    if (await this.locator.isVisible().catch(() => false)) {
      // element is already in the DOM - Playwright can scroll it into view directly
      await this.locator.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
      return;
    }
    // panel not yet in DOM (Grafana 13.x lazy render) - scroll page viewport-by-viewport
    // until the element mounts, then scroll it precisely into view
    const viewportHeight = await this.ctx.page.evaluate(() => window.innerHeight);
    let scrollY = 0;
    while (true) {
      const scrollHeight = await this.ctx.page.evaluate(() => document.documentElement.scrollHeight);
      if (scrollY >= scrollHeight) {
        break;
      }
      scrollY = Math.min(scrollY + viewportHeight, scrollHeight);
      await this.ctx.page.evaluate((y) => window.scrollTo(0, y), scrollY);
      await this.ctx.page.waitForTimeout(500);
      if (await this.locator.isVisible().catch(() => false)) {
        break;
      }
    }
    // element has mounted but may be above the current scroll position — bring it precisely into view
    await this.locator.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
  }

  /**
   * Returns the data the panel received, as serialised by the `grafana-e2edata-panel` panel plugin.
   * The panel must use that visualization.
   *
   * Waits until the panel's loading state is one of `options.states` (default `Done` or `Error`).
   *
   * @alpha - the API is not yet stable and may change without a major version bump. Use with caution.
   */
  async getData(options?: GetPanelDataOptions): Promise<PanelData> {
    const states = options?.states ?? DEFAULT_PANEL_DATA_STATES;
    const root = this.getDataPanelLocator();

    await this.scrollIntoView();
    await expect(root, `Expected the panel to use the ${E2E_DATA_PANEL_ID} visualization`).toBeAttached({
      timeout: options?.timeout,
    });

    let json: string | null = null;
    await expect(async () => {
      // read attributes and payload in one go so they come from the same render
      const snapshot = await root.evaluate(
        (el, jsonTestId) => ({
          state: el.getAttribute('data-state'),
          json: el.querySelector(`[data-testid="${jsonTestId}"]`)?.textContent ?? null,
        }),
        E2E_DATA_PANEL_JSON_TESTID
      );
      expect(states, 'panel loading state').toContain(snapshot.state);
      json = snapshot.json;
    }).toPass({ timeout: options?.timeout });

    return parsePanelData(json, 'the panel');
  }

  private getDataPanelLocator(): Locator {
    return this.locator.locator(`[data-testid="${E2E_DATA_PANEL_TESTID}"]`);
  }

  /**
   * Returns the locator for the panel error (if any)
   */
  getErrorIcon(): Locator {
    let selector = this.ctx.selectors.components.Panels.Panel.status(ERROR_STATUS);

    // the selector (not the selector value) used to identify a panel error changed in 9.4.3
    if (lt(this.ctx.grafanaVersion, '9.5.0')) {
      selector = this.ctx.selectors.components.Panels.Panel.headerCornerInfo(ERROR_STATUS);
    }

    return this.getByGrafanaSelector(selector, {
      root: this.locator,
    });
  }
}
