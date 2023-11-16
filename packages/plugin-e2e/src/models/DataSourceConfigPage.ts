import { Expect } from '@playwright/test';
import { createDataSourceViaAPI } from '../fixtures/commands/createDataSource';
import { DataSource, PluginTestCtx } from '../types';
import { GrafanaPage } from './GrafanaPage';

export class DataSourceConfigPage extends GrafanaPage {
  datasourceJson: DataSource | undefined;

  constructor(ctx: PluginTestCtx, expect: Expect<any>) {
    super(ctx, expect);
  }

  async createDataSource(datasource: DataSource) {
    this.datasourceJson = await createDataSourceViaAPI(this.ctx.request, datasource);
    await this.goto();
  }

  async deleteDataSource() {
    if (this.datasourceJson) {
      await this.ctx.request.delete(`/api/datasources/uid/${this.datasourceJson.uid}`);
    }
  }

  async goto() {
    if (!this.datasourceJson) {
      throw new Error('Datasource not created');
    }

    await this.ctx.page.goto(this.ctx.selectors.pages.EditDataSource.url(this.datasourceJson.uid), {
      waitUntil: 'load',
    });
  }

  /**
   * Mocks the response of the datasource health check call
   * @param json the json response to return
   * @param status the HTTP status code to return. Defaults to 200
   */
  async mockHealthCheckResponse<T = any>(json: T, status = 200) {
    await this.ctx.page.route(`${this.ctx.selectors.apis.DataSource.healthCheck}`, async (route) => {
      await route.fulfill({ json, status });
    });
  }

  async saveAndTest() {
    await this.getByTestIdOrAriaLabel(this.ctx.selectors.pages.DataSource.saveAndTest).click();
    return this.ctx.page.waitForResponse((resp) => resp.url().includes('/health'));
  }
}
