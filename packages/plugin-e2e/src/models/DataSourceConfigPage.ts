import { DataSource, NavigateOptions, PluginTestCtx } from '../types';
import { GrafanaPage } from './GrafanaPage';

export class DataSourceConfigPage extends GrafanaPage {
  constructor(ctx: PluginTestCtx, private datasource: DataSource) {
    super(ctx);
  }

  async deleteDataSource() {
    await this.ctx.request.delete(this.ctx.selectors.apis.DataSource.delete(this.datasource.uid));
  }

  async goto(options?: NavigateOptions) {
    return super.navigate(this.ctx.selectors.pages.EditDataSource.url(this.datasource.uid), options);
  }

  /**
   * Mocks the response of the datasource health check call
   * @param json the json response to return
   * @param status the HTTP status code to return. Defaults to 200
   */
  async mockHealthCheckResponse<T = any>(json: T, status = 200) {
    await this.ctx.page.route(`${this.ctx.selectors.apis.DataSource.health}`, async (route) => {
      await route.fulfill({ json, status });
    });
  }

  async saveAndTest() {
    const responsePromise = this.ctx.page.waitForResponse((resp) =>
      resp
        .url()
        .includes(
          this.ctx.selectors.apis.DataSource.health(this.datasource.uid ?? '', this.datasource.id.toString() ?? '')
        )
    );
    await this.getByTestIdOrAriaLabel(this.ctx.selectors.pages.DataSource.saveAndTest).click();
    return responsePromise;
  }
}
