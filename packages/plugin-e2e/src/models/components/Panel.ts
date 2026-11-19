import { Locator } from '@playwright/test';
import { lt } from '../../utils/version';
import { PluginTestCtx } from '../../types';
import { GrafanaPage } from '../pages/GrafanaPage';
import { getPanelActionsPopoverButtonName } from '../utils';

const ERROR_STATUS = 'error';
const POPOVER_BUTTON_TIMEOUT_MS = 2000;

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
   *
   * When the panel header has no menu button, because the panel actions popover is enabled
   * (the grafana.panelActionsPopover feature flag), the panel is hovered to open the popover.
   * Items that moved from the menu to the popover (View, Edit, Explore, Copy, Duplicate and Remove) are clicked
   * in the popover when options.parentItem isn't set and the popover offers them, e.g. clicking 'View' clicks Expand.
   * Other items are clicked in the panel menu, which the popover's More actions button opens.
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
    } else {
      // the panel menu button renders together with the panel, so its absence means the panel actions popover is used
      await this.locator.waitFor({ state: 'attached' });
      if ((await panelMenu.count()) === 0) {
        const actionsPopover = await this.openActionsPopover();
        if (!options?.parentItem && (await this.clickOnActionsPopoverButton(actionsPopover, item))) {
          return;
        }
        // the popover's More actions button
        panelMenu = this.getByGrafanaSelector(this.ctx.selectors.components.Panels.Panel.menu(''), {
          startsWith: true,
          root: actionsPopover,
        });
      }
    }

    await panelMenu.click({ force: true });
    options?.parentItem && (await parentMenuItem.hover());
    await menuItem.click();
  }

  /**
   * Hovers the panel to open its panel actions popover, and returns the popover's toolbar.
   */
  private async openActionsPopover(): Promise<Locator> {
    await this.locator.hover();
    const toolbar = this.ctx.page.getByRole('toolbar', {
      name: this.ctx.selectors.constants.PanelActionsPopover.toolbar,
    });
    await toolbar.waitFor({ state: 'visible' });
    return toolbar;
  }

  /**
   * Clicks the panel actions popover button that replaces the given menu item.
   * Returns false if the popover doesn't offer one, e.g. Explore in edit mode.
   */
  private async clickOnActionsPopoverButton(toolbar: Locator, item: string): Promise<boolean> {
    const buttonName = getPanelActionsPopoverButtonName(item, this.ctx.selectors.constants.PanelActionsPopover);
    if (!buttonName) {
      return false;
    }
    const button = toolbar.getByRole('button', { name: buttonName });
    // Explore is added once its URL resolves, so the button isn't necessarily there when the popover opens
    const hasButton = await button
      .waitFor({ state: 'visible', timeout: POPOVER_BUTTON_TIMEOUT_MS })
      .then(() => true)
      .catch(() => false);
    if (!hasButton) {
      return false;
    }
    await button.click();
    return true;
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
