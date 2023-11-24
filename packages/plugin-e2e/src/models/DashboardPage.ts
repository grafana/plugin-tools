const gte = require('semver/functions/gte');

import { GotoDashboardArgs, PluginTestCtx } from '../types';

import { Expect } from '@playwright/test';
import { DataSourcePicker } from './DataSourcePicker';
import { GrafanaPage } from './GrafanaPage';
import { PanelEditPage } from './PanelEditPage';
import { TimeRange } from './TimeRange';

export class DashboardPage extends GrafanaPage {
  dataSourcePicker: any;
  timeRange: TimeRange;

  constructor(ctx: PluginTestCtx, expect: Expect<any>, protected readonly dashboardUid?: string) {
    super(ctx, expect);
    this.dataSourcePicker = new DataSourcePicker(ctx, expect);
    this.timeRange = new TimeRange(ctx, this.expect);
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
    return new PanelEditPage(this.ctx, this.expect);
  }

  async addPanel(): Promise<PanelEditPage> {
    if (gte(this.ctx.grafanaVersion, '10.0.0')) {
      //TODO: add new selector and use it in grafana/ui
      const title = gte(this.ctx.grafanaVersion, '10.1.0') ? 'Add button' : 'Add panel button';
      await this.getByTestIdOrAriaLabel(this.ctx.selectors.components.PageToolbar.itemButton(title)).click();
      await this.getByTestIdOrAriaLabel(
        this.ctx.selectors.pages.AddDashboard.itemButton('Add new visualization menu item')
      ).click();
    } else {
      await this.getByTestIdOrAriaLabel(this.ctx.selectors.pages.AddDashboard.addNewPanel).click();
    }

    return new PanelEditPage(this.ctx, this.expect);
  }

  async deleteDashboard() {
    await this.ctx.request.delete(`/api/datasources/uid/${this.dashboardUid}`);
  }

  async refreshDashboard() {
    await this.ctx.page.getByTestId(this.ctx.selectors.components.RefreshPicker.runButtonV2).click();
  }
}
