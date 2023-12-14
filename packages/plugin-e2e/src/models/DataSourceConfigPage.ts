import { PluginTestCtx } from '../types';
import { GrafanaPage } from './GrafanaPage';

export class DataSourceConfigPage extends GrafanaPage {
  constructor(ctx: PluginTestCtx, private uid: string) {
    super(ctx);
  }

  async deleteDataSource() {
    await this.ctx.request.delete(this.ctx.selectors.apis.DataSource.delete(this.uid));
  }

  async goto() {
    await this.ctx.page.goto(this.ctx.selectors.pages.EditDataSource.url(this.uid), {
      waitUntil: 'load',
    });
  }

  /**
   * Mocks the response of the datasource health check call
   * @param json the json response to return
   * @param status the HTTP status code to return. Defaults to 200
   */
  async mockHealthCheckResponse<T = any>(json: T, status = 200) {
    await this.ctx.page.route(`${this.ctx.selectors.apis.DataSource.healthPattern}`, async (route) => {
      await route.fulfill({ json, status });
    });
  }

  async saveAndTest() {
    await this.getByTestIdOrAriaLabel(this.ctx.selectors.pages.DataSource.saveAndTest).click();
    return this.ctx.page.waitForResponse((resp) =>
      resp.url().includes(this.ctx.selectors.apis.DataSource.health(this.uid))
    );
  }
}
