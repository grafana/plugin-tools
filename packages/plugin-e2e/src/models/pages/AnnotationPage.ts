import * as semver from 'semver';
import { DashboardPageArgs, NavigateOptions, PluginTestCtx } from '../../types';
import { AnnotationEditPage } from './AnnotationEditPage';
import { GrafanaPage } from './GrafanaPage';

export class AnnotationPage extends GrafanaPage {
  constructor(
    readonly ctx: PluginTestCtx,
    readonly dashboard?: DashboardPageArgs
  ) {
    super(ctx, dashboard);
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
    const { addAnnotationCTAV2 } = this.ctx.selectors.pages.Dashboard.Settings.Annotations.List;

    if (!this.dashboard?.uid) {
      await this.getByGrafanaSelector(addAnnotationCTAV2).click();
    } else {
      //the dashboard already has annotations
      const newQueryButton = semver.gte(this.ctx.grafanaVersion, '11.0.0')
        ? this.getByGrafanaSelector(addAnnotationCTAV2)
        : this.ctx.page.getByRole('button', { name: 'New query' });
      await newQueryButton.click();
    }

    const editIndex = await this.ctx.page.evaluate(() => {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('editIndex');
    });

    return new AnnotationEditPage(this.ctx, { id: editIndex || '1' });
  }
}
