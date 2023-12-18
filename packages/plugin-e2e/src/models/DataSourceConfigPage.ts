import { DataSource, PluginTestCtx, TriggerQueryOptions } from '../types';
import { GrafanaPage } from './GrafanaPage';

export class DataSourceConfigPage extends GrafanaPage {
  constructor(ctx: PluginTestCtx, private datasource: DataSource) {
    super(ctx);
  }
  async deleteDataSource() {
    await this.ctx.request.delete(this.ctx.selectors.apis.DataSource.datasourceByUID(this.datasource.uid));
  }

  async goto() {
    await this.ctx.page.goto(this.ctx.selectors.pages.EditDataSource.url(this.datasource.uid), {
      waitUntil: 'load',
    });
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

  /**
   * Clicks the save and test button and waits for the response
   *
   * Optionally, you can skip waiting for the response by passing in { skipWaitForResponse: true } as the options parameter
   */
  async saveAndTest(options?: TriggerQueryOptions) {
    if (options?.skipWaitForResponse) {
      return this.getByTestIdOrAriaLabel(this.ctx.selectors.pages.DataSource.saveAndTest).click();
    }

    const saveResponsePromise = this.ctx.page.waitForResponse((resp) =>
      resp.url().includes(this.ctx.selectors.apis.DataSource.datasourceByUID(this.datasource.uid))
    );
    const healthResponsePromise = this.ctx.page.waitForResponse((resp) =>
      resp
        .url()
        .includes(
          this.ctx.selectors.apis.DataSource.health(this.datasource.uid ?? '', this.datasource.id.toString() ?? '')
        )
    );
    await this.getByTestIdOrAriaLabel(this.ctx.selectors.pages.DataSource.saveAndTest).click();
    return saveResponsePromise.then(() => healthResponsePromise);
  }
}
