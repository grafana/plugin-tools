import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';
import { GrafanaPage } from '../pages/GrafanaPage';

export class DataSourcePicker extends GrafanaPage {
  constructor(ctx: PluginTestCtx, private root?: Locator) {
    super(ctx);
  }

  /**
   * Sets the data source picker to the provided name
   */
  async set(name: string) {
    await this.getByGrafanaSelector(this.ctx.selectors.components.DataSourcePicker.container, { root: this.root })
      .locator('input')
      .fill(name);

    // this is a hack to get the selection to work in 10.ish versions of Grafana.
    // TODO: investigate if the select component can somehow be refactored so that its easier to test with playwright
    await this.ctx.page.keyboard.press('ArrowDown');
    await this.ctx.page.keyboard.press('ArrowUp');
    await this.ctx.page.keyboard.press('Enter');
  }
}
