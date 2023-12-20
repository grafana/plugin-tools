import { expect, Locator } from '@playwright/test';
import * as semver from 'semver';
import {
  DashboardEditViewArgs,
  NavigateOptions,
  PanelError,
  PluginTestCtx,
  RequestOptions,
  Visualization,
} from '../types';
import { DataSourcePicker } from './DataSourcePicker';
import { GrafanaPage } from './GrafanaPage';
import { TimeRange } from './TimeRange';

const ERROR_STATUS = 'error';

export class PanelEditPage extends GrafanaPage implements PanelError {
  datasource: DataSourcePicker;
  timeRange: TimeRange;

  constructor(readonly ctx: PluginTestCtx, readonly args: DashboardEditViewArgs<string>) {
    super(ctx);
    this.datasource = new DataSourcePicker(ctx);
    this.timeRange = new TimeRange(ctx);
  }

  async goto(options?: NavigateOptions) {
    const url = this.args.dashboard?.uid
      ? this.ctx.selectors.pages.Dashboard.url(this.args.dashboard.uid)
      : this.ctx.selectors.pages.AddDashboard.url;

    options ??= {};
    options.queryParams ??= new URLSearchParams();
    options.queryParams.append('editPanel', this.args.id);

    await super.navigate(url, options);
  }

  async setVisualization(visualization: Visualization) {
    await this.getByTestIdOrAriaLabel(this.ctx.selectors.components.PanelEditor.toggleVizPicker).click();
    await this.getByTestIdOrAriaLabel(this.ctx.selectors.components.PluginVisualization.item(visualization)).click();
    await expect(
      this.getByTestIdOrAriaLabel(this.ctx.selectors.components.PanelEditor.toggleVizPicker),
      `Could not set visualization to ${visualization}. Ensure the panel is installed.`
    ).toHaveText(visualization);
  }

  async apply() {
    await this.ctx.page.getByTestId(this.ctx.selectors.components.PanelEditor.applyButton).click();
  }

  async getQueryEditorRow(refId: string): Promise<Locator> {
    const locator = this.getByTestIdOrAriaLabel(this.ctx.selectors.components.QueryEditorRows.rows).filter({
      has: this.getByTestIdOrAriaLabel(this.ctx.selectors.components.QueryEditorRow.title(refId)),
    });
    await expect(locator).toBeVisible();
    return locator;
  }

  getPanelError() {
    // the selector (not the selector value) used to identify a panel error changed in 9.4.3
    if (semver.lte(this.ctx.grafanaVersion, '9.4.3')) {
      return this.getByTestIdOrAriaLabel(this.ctx.selectors.components.Panels.Panel.headerCornerInfo(ERROR_STATUS));
    }

    return this.getByTestIdOrAriaLabel(this.ctx.selectors.components.Panels.Panel.status(ERROR_STATUS));
  }

  async refreshPanel(options?: RequestOptions) {
    const responsePromise = this.ctx.page.waitForResponse(
      (resp) => resp.url().includes(this.ctx.selectors.apis.DataSource.query),
      options
    );
    // in older versions of grafana, the refresh button is rendered twice. this is a workaround to click the correct one
    await this.getByTestIdOrAriaLabel(this.ctx.selectors.components.PanelEditor.General.content)
      .locator(`selector=${this.ctx.selectors.components.RefreshPicker.runButtonV2}`)
      .click();

    return responsePromise;
  }
}
