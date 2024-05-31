import { Locator } from '@playwright/test';
import * as semver from 'semver';
import { PluginTestCtx } from '../../types';
import { GrafanaPage } from '../pages/GrafanaPage';

const ERROR_STATUS = 'error';

export class Panel extends GrafanaPage {
  constructor(readonly ctx: PluginTestCtx, readonly locator: Locator) {
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
    return panel.locator('[role="cell"]');
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
      this.ctx.page.locator(`[aria-label="Panel header item ${options?.parentItem}"]`);
      this.ctx.page.locator(`[aria-label="Panel header item ${item}"]`);
      parentMenuItem = this.ctx.page.getByText(options?.parentItem ?? '');
      menuItem = this.ctx.page.getByTestId('panel-dropdown').getByText(item);
    }

    await panelMenu.click({ force: true });
    options?.parentItem && (await parentMenuItem.hover());
    await menuItem.click();
  }

  /**
   * Returns the locator for the panel error (if any)
   */
  getErrorIcon(): Locator {
    let selector = this.ctx.selectors.components.Panels.Panel.status(ERROR_STATUS);

    // the selector (not the selector value) used to identify a panel error changed in 9.4.3
    if (semver.lte(this.ctx.grafanaVersion, '9.4.3')) {
      selector = this.ctx.selectors.components.Panels.Panel.headerCornerInfo(ERROR_STATUS);
    }

    return this.getByGrafanaSelector(selector, {
      root: this.locator,
    });
  }
}
