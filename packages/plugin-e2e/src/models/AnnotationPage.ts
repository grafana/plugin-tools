import * as semver from 'semver';
import { DashboardPageArgs, NavigateOptions, PluginTestCtx } from '../types';
import { AnnotationEditPage } from './AnnotationEditPage';
import { GrafanaPage } from './GrafanaPage';

export class AnnotationPage extends GrafanaPage {
  constructor(readonly ctx: PluginTestCtx, readonly dashboard?: DashboardPageArgs) {
    super(ctx);
  }

  /**
   * Navigates to the annotation list page. If a dashboard uid was not provided, it's assumed that it's a new dashboard.
   */
  async goto(options?: NavigateOptions) {
    const { Dashboard, AddDashboard } = this.ctx.selectors.pages;
    let url = this.dashboard?.uid
      ? Dashboard.Settings.Annotations.List.url(this.dashboard.uid)
      : AddDashboard.Settings.Annotations.List.url;

    return super.navigate(url, options);
  }

  /**
   * Clicks the add new annotation button and returns the annotation edit page
   */
  async clickAddNew() {
    const { Dashboard } = this.ctx.selectors.pages;

    if (!this.dashboard?.uid) {
      //the dashboard doesn't have any annotations yet (except for the built-in one)
      if (semver.gte(this.ctx.grafanaVersion, '8.3.0')) {
        await this.getByTestIdOrAriaLabel(Dashboard.Settings.Annotations.List.addAnnotationCTAV2).click();
      } else {
        await this.getByTestIdOrAriaLabel(Dashboard.Settings.Annotations.List.addAnnotationCTA).click();
      }
    } else {
      //the dashboard already has annotations
      //TODO: add new selector and use it in grafana/ui
      await this.ctx.page.getByRole('button', { name: 'New query' }).click();
    }

    const editIndex = await this.ctx.page.evaluate(() => {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('editIndex');
    });

    return new AnnotationEditPage(this.ctx, { id: editIndex || '1' });
  }
}
