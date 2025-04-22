import * as semver from 'semver';
import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';
import { GrafanaPage } from '../pages/GrafanaPage';

export class DataSourcePicker extends GrafanaPage {
  constructor(
    ctx: PluginTestCtx,
    private root?: Locator
  ) {
    super(ctx);
  }

  /**
   * Sets the data source picker to the provided name
   */
  async set(name: string) {
    let datasourcePicker = await (this.root || this.ctx.page).getByTestId(
      this.ctx.selectors.components.DataSourcePicker.inputV2
    );

    if (semver.lt(this.ctx.grafanaVersion, '10.1.0')) {
      datasourcePicker = await this.getByGrafanaSelector(this.ctx.selectors.components.DataSourcePicker.container, {
        root: this.root,
      }).locator('input');
    }

    await datasourcePicker.fill(name);

    // this is a hack to get the selection to work in 10.ish versions of Grafana.
    // TODO: investigate if the select component can somehow be refactored so that its easier to test with playwright
    await this.ctx.page.keyboard.press('ArrowDown');
    await this.ctx.page.keyboard.press('ArrowUp');
    await this.ctx.page.keyboard.press('Enter');
  }
}
