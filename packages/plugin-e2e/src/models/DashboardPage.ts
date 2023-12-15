const gte = require('semver/functions/gte');
import { DashboardPageArgs, NavigateOptions, PluginTestCtx } from '../types';
import { DataSourcePicker } from './DataSourcePicker';
import { GrafanaPage } from './GrafanaPage';
import { PanelEditPage } from './PanelEditPage';
import { TimeRange } from './TimeRange';

export class DashboardPage extends GrafanaPage {
  dataSourcePicker: any;
  timeRange: TimeRange;

  constructor(ctx: PluginTestCtx, private dashboard?: DashboardPageArgs) {
    super(ctx);
    this.dataSourcePicker = new DataSourcePicker(ctx);
    this.timeRange = new TimeRange(ctx);
  }

  async goto(options?: NavigateOptions) {
    let url = this.dashboard?.uid
      ? this.ctx.selectors.pages.Dashboard.url(this.dashboard.uid)
      : this.ctx.selectors.pages.AddDashboard.url;

    if (this.dashboard?.timeRange) {
      options.queryParams = options.queryParams ?? new URLSearchParams();
      options.queryParams.append('from', this.dashboard.timeRange.from);
      options.queryParams.append('to', this.dashboard.timeRange.to);
    }

    return super.navigate(url, options);
  }

  async gotoPanelEditPage(panelId: string) {
    const panelEditPage = new PanelEditPage(this.ctx, { dashboard: this.dashboard, id: panelId });
    await panelEditPage.goto();
    return panelEditPage;
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

    const panelId = await this.ctx.page.evaluate(() => {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('editPanel');
    });

    return new PanelEditPage(this.ctx, { dashboard: this.dashboard, id: panelId });
  }

  async deleteDashboard() {
    await this.ctx.request.delete(this.ctx.selectors.apis.Dashboard.delete(this.dashboard.uid));
  }

  async refreshDashboard() {
    await this.ctx.page.getByTestId(this.ctx.selectors.components.RefreshPicker.runButtonV2).click();
  }
}
