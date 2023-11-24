import { Expect, Locator } from '@playwright/test';
import * as semver from 'semver';
import { PanelError, PluginTestCtx, RequestOptions, Visualization } from '../types';
import { DataSourcePicker } from './DataSourcePicker';
import { GrafanaPage } from './GrafanaPage';
import { TimeRange } from './TimeRange';

export class PanelEditPage extends GrafanaPage implements PanelError {
  datasource: DataSourcePicker;
  timeRange: TimeRange;

  constructor(ctx: PluginTestCtx, expect: Expect<any>) {
    super(ctx, expect);
    this.datasource = new DataSourcePicker(ctx, expect);
    this.timeRange = new TimeRange(ctx, this.expect);
  }

  async setVisualization(visualization: Visualization) {
    await this.getByTestIdOrAriaLabel(this.ctx.selectors.components.PanelEditor.toggleVizPicker).click();
    await this.getByTestIdOrAriaLabel(this.ctx.selectors.components.PluginVisualization.item(visualization)).click();
    await this.expect(
      this.getByTestIdOrAriaLabel(this.ctx.selectors.components.PanelEditor.toggleVizPicker),
      `Could not set visualization to ${visualization}. Ensure the panel is installed.`
    ).toHaveText(visualization);
  }

  async apply() {
    await this.ctx.page.getByTestId(this.ctx.selectors.components.PanelEditor.applyButton).click();
  }

  getQueryEditorRow(refId: string): Locator {
    //TODO: add new selector and use it in grafana/ui
    const locator = this.ctx.page.locator('[aria-label="Query editor row"]').filter({
      has: this.ctx.page.locator(`[aria-label="Query editor row title ${refId}"]`),
    });
    this.expect(locator).toBeVisible();
    return locator;
  }

  getPanelError() {
    // the selector (not the selector value) used to identify a panel error changed in 9.4.3 and in 10.1.5
    let selector = this.ctx.selectors.components.Panels.Panel.status('error');
    if (semver.lte(this.ctx.grafanaVersion, '9.4.3')) {
      selector = this.ctx.selectors.components.Panels.Panel.headerCornerInfo('error');
    } else if (semver.lte(this.ctx.grafanaVersion, '10.1.5')) {
      selector = 'Panel status';
    }

    return this.getByTestIdOrAriaLabel(selector);
  }

  async refreshPanel(options?: RequestOptions) {
    const responsePromise = this.ctx.page.waitForResponse((resp) => resp.url().includes('/query'), options);
    // in older versions of grafana, the refresh button is rendered twice. this is a workaround to click the correct one
    await this.getByTestIdOrAriaLabel(this.ctx.selectors.components.PanelEditor.General.content)
      .locator(`selector=${this.ctx.selectors.components.RefreshPicker.runButtonV2}`)
      .click();

    return responsePromise;
  }
}
