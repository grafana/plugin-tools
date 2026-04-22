import { Locator } from '@playwright/test';
import * as semver from 'semver';
import { PluginTestCtx } from '../../types';
import { GrafanaPage } from '../pages/GrafanaPage';

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
    if (semver.lt(this.ctx.grafanaVersion, '12.2.0')) {
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
    if (semver.lt(this.ctx.grafanaVersion, '9.5.0')) {
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
   * `.react-grid-item` containers progressively until the panel element appears, then
   * scrolls the panel element precisely into view. In older Grafana versions the panel
   * element is always in the DOM, so the loop exits early and delegates to the standard
   * scroll path.
   */
  async scrollIntoView(): Promise<void> {
    // fast path: panel already in DOM (eager render or already in viewport)
    if (await this.locator.isVisible({ timeout: 500 }).catch(() => false)) {
      await this.locator.scrollIntoViewIfNeeded();
      return;
    }

    // slow path: lazy-rendered panel - scroll grid items until the panel element appears.
    // in Grafana 13.x with dashboardNewLayouts, .react-grid-item elements are not in the
    // DOM immediately after navigation (~1-2s for the grid layout to render), so we wait
    // for at least one to appear before iterating. the 500ms pause after each container
    // matches scrollToRevealAllPanels: it gives IntersectionObserver time to fire and the
    // VizPanel time to mount before we check.
    const containers = this.ctx.page.locator('.react-grid-item');
    await containers
      .first()
      .waitFor({ state: 'attached', timeout: 5_000 })
      .catch(() => {});
    const count = await containers.count();
    for (let i = 0; i < count; i++) {
      await containers.nth(i).scrollIntoViewIfNeeded();
      await this.ctx.page.waitForTimeout(500);
      if (await this.locator.isVisible().catch(() => false)) {
        break;
      }
    }

    await this.locator.scrollIntoViewIfNeeded();
  }

  /**
   * Returns the locator for the panel error (if any)
   */
  getErrorIcon(): Locator {
    let selector = this.ctx.selectors.components.Panels.Panel.status(ERROR_STATUS);

    // the selector (not the selector value) used to identify a panel error changed in 9.4.3
    if (semver.lt(this.ctx.grafanaVersion, '9.5.0')) {
      selector = this.ctx.selectors.components.Panels.Panel.headerCornerInfo(ERROR_STATUS);
    }

    return this.getByGrafanaSelector(selector, {
      root: this.locator,
    });
  }
}
