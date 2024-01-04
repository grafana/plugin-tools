import { DataSourcePicker } from './DataSourcePicker';
import { DashboardEditViewArgs, NavigateOptions, PluginTestCtx, RequestOptions } from '../types';
import { GrafanaPage } from './GrafanaPage';

export class AnnotationEditPage extends GrafanaPage {
  datasource: DataSourcePicker;
  constructor(readonly ctx: PluginTestCtx, readonly args: DashboardEditViewArgs<string>) {
    super(ctx);
    this.datasource = new DataSourcePicker(ctx);
  }

  /**
   * Navigates to the annotation edit page. If a dashboard uid was not provided, it's assumed that it's a new dashboard.
   */
  async goto(options?: NavigateOptions) {
    const { Dashboard, AddDashboard } = this.ctx.selectors.pages;
    const url = this.args.dashboard?.uid
      ? Dashboard.Settings.Annotations.Edit.url(this.args.dashboard.uid, this.args.id)
      : AddDashboard.Settings.Annotations.Edit.url(this.args.id);

    return super.navigate(url, options);
  }

  /**
   * Executes the annotation query defined in the annotation page and returns the response promise
   * @param options - Optional. RequestOptions to pass to waitForResponse
   */
  async runQuery(options?: RequestOptions) {
    const responsePromise = this.ctx.page.waitForResponse(
      (resp) => resp.url().includes(this.ctx.selectors.apis.DataSource.query),
      options
    );
    //TODO: add new selector and use it in grafana/ui
    await this.ctx.page.getByRole('button', { name: 'TEST' }).click();
    return responsePromise;
  }
}
