const gte = require('semver/functions/gte');
import { GotoDashboardArgs, PluginTestCtx } from '../types';
import { DataSourcePicker } from './DataSourcePicker';
import { GrafanaPage } from './GrafanaPage';
import { PanelEditPage } from './PanelEditPage';
import { TimeRange } from './TimeRange';

export class DashboardPage extends GrafanaPage {
  dataSourcePicker: any;
  timeRange: TimeRange;

  constructor(ctx: PluginTestCtx, protected readonly dashboardUid?: string) {
    super(ctx);
    this.dataSourcePicker = new DataSourcePicker(ctx);
    this.timeRange = new TimeRange(ctx);
  }

  async goto(opts?: GotoDashboardArgs) {
    const uid = opts?.uid || this.dashboardUid;
    let url = uid ? this.ctx.selectors.pages.Dashboard.url(uid) : this.ctx.selectors.pages.AddDashboard.url;
    if (opts?.queryParams) {
      url += `?${opts.queryParams.toString()}`;
    }
    await this.ctx.page.goto(url, {
      waitUntil: 'networkidle',
    });
    if (opts?.timeRange) {
      await this.timeRange.set(opts.timeRange);
    }
  }

  async gotoPanelEditPage(panelId: string) {
    const url = this.ctx.selectors.pages.Dashboard.url(this.dashboardUid ?? '');
    await this.ctx.page.goto(`${url}?editPanel=${panelId}`, {
      waitUntil: 'networkidle',
    });
    return new PanelEditPage(this.ctx);
  }

  async addPanel(): Promise<PanelEditPage> {
    const { components, pages } = this.ctx.selectors;
    if (gte(this.ctx.grafanaVersion, '10.0.0')) {
      await this.getByTestIdOrAriaLabel(
        components.PageToolbar.itemButton(components.PageToolbar.itemButtonTitle)
      ).click();
      await this.getByTestIdOrAriaLabel(pages.AddDashboard.itemButton(pages.AddDashboard.itemButtonAddViz)).click();
    } else {
      await this.getByTestIdOrAriaLabel(pages.AddDashboard.addNewPanel).click();
    }

    return new PanelEditPage(this.ctx);
  }

  async deleteDashboard() {
    await this.ctx.request.delete(this.ctx.selectors.apis.Dashboard.delete(this.dashboardUid));
  }

  async refreshDashboard() {
    await this.ctx.page.getByTestId(this.ctx.selectors.components.RefreshPicker.runButtonV2).click();
  }
}
