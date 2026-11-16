import { Response } from '@playwright/test';
import { DataSourceSettings, NavigateOptions, PluginTestCtx, TriggerRequestOptions } from '../../types';
import { GrafanaPage } from './GrafanaPage';
import { isDataSourceSaveUrl, isHealthCheckUrl } from '../../utils/dataSourceRequests';

export class DataSourceConfigPage extends GrafanaPage {
  constructor(
    ctx: PluginTestCtx,
    public datasource: DataSourceSettings
  ) {
    super(ctx);
  }
  async deleteDataSource() {
    await this.ctx.request.delete(this.ctx.selectors.apis.DataSource.datasourceByUID(this.datasource.uid));
  }

  /**
   * Navigates to the datasource edit page for an existing datasource
   */
  async goto(options?: NavigateOptions) {
    return super.navigate(this.ctx.selectors.pages.EditDataSource.url(this.datasource.uid), options);
  }

  /**
   * Mocks the response of the datasource health check call
   * @param json the json response to return
   * @param status the HTTP status code to return. Defaults to 200
   */
  async mockHealthCheckResponse<T = any>(json: T, status = 200) {
    await this.ctx.page.route(
      `${this.ctx.selectors.apis.DataSource.health(this.datasource.uid, this.datasource.id.toString())}`,
      async (route) => {
        await route.fulfill({ json, status });
      }
    );
    // the health check goes to the datasource apiserver instead when the apiserver feature flags are on
    await this.ctx.page.route(
      this.ctx.selectors.apis.DataSource.appPlatformHealthPattern(this.datasource.uid),
      async (route) => {
        await route.fulfill({ json, status });
      }
    );
  }

  /**
   * Clicks the save and test button and waits for the response
   *
   * By default, this will return the response of the health check call to /api/datasources/uid/<pluginUid>/health.
   * Optionally, if your plugin uses a custom health check endpoint, you can provide the {@link TriggerRequestOptions.path } of this url.
   * May be useful for data source plugins that don't have a backend.
   */
  async saveAndTest(options?: TriggerRequestOptions): Promise<Response> {
    const { datasourceByUID, health, appPlatformDataSourcePattern, appPlatformHealthPattern } =
      this.ctx.selectors.apis.DataSource;
    const { uid, id } = this.datasource;
    const saveResponsePromise = this.ctx.page.waitForResponse((resp) =>
      isDataSourceSaveUrl(resp.url(), datasourceByUID(uid), appPlatformDataSourcePattern(uid))
    );
    // a custom health path is the one the plugin calls, so only the default health check can move to the apiserver
    const healthResponsePromise = options?.path
      ? this.ctx.page.waitForResponse((resp) => resp.url().includes(options.path!))
      : this.ctx.page.waitForResponse((resp) =>
          isHealthCheckUrl(resp.url(), health(uid, id.toString()), appPlatformHealthPattern(uid))
        );
    await this.getByGrafanaSelector(this.ctx.selectors.pages.DataSource.saveAndTest).click();
    return saveResponsePromise.then(() => healthResponsePromise);
  }
}
