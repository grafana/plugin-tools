import { Locator, Request, Response } from '@playwright/test';
import { getByGrafanaSelectorOptions, GrafanaPageArgs, NavigateOptions, PluginTestCtx } from '../../types';
import { resolveGrafanaSelector } from '../utils';

/**
 * Base class for all Grafana pages.
 *
 * Exposes methods for locating Grafana specific elements on the page
 */
export abstract class GrafanaPage {
  constructor(
    public readonly ctx: PluginTestCtx,
    public readonly pageArgs: GrafanaPageArgs = {}
  ) {}

  protected async navigate(url: string, options?: NavigateOptions) {
    let queryParams = options?.queryParams ? options.queryParams : this.pageArgs.queryParams;
    if (queryParams) {
      url += `?${queryParams.toString()}`;
    }
    await this.ctx.page.goto(url, {
      waitUntil: 'load',
      ...this.pageArgs,
      ...options,
    });
  }

  /**
   * Get a locator based on a Grafana E2E selector. A grafana E2E selector is defined in @grafana/e2e-selectors or in plugin-e2e/src/e2e-selectors.
   * An E2E selector is a string that identifies a specific element in the Grafana UI. The element referencing the E2E selector use the data-testid or aria-label attribute.
   */
  getByGrafanaSelector(selector: string, options?: getByGrafanaSelectorOptions): Locator {
    return (options?.root ?? this.ctx.page).locator(resolveGrafanaSelector(selector, options));
  }

  /**
   * Mocks the response of the datasource query call
   * @param json the json response to return
   * @param status the HTTP status code to return. Defaults to 200
   */
  async mockQueryDataResponse<T = any>(json: T, status = 200) {
    await this.ctx.page.route(this.ctx.selectors.apis.DataSource.queryPattern, async (route) => {
      await route.fulfill({ json, status });
    });
  }

  /**
   * Mocks the response of the datasource resource request.
   * https://grafana.com/developers/plugin-tools/key-concepts/backend-plugins#resources
   *
   * @param path the path of the resource to mock
   * @param json the json response to return
   * @param status the HTTP status code to return. Defaults to 200
   */
  async mockResourceResponse<T = any>(path: string, json: T, status = 200) {
    await this.ctx.page.route(`${this.ctx.selectors.apis.DataSource.resourceUIDPattern}/${path}`, async (route) => {
      await route.fulfill({ json, status });
    });
    // some data sources use the backendSrv directly, and then the path may be different
    await this.ctx.page.route(`${this.ctx.selectors.apis.DataSource.resourcePattern}/${path}`, async (route) => {
      await route.fulfill({ json, status });
    });
  }

  /**
   * Waits for a data source query data request to be made.
   *
   * @param cb optional callback to filter the request. Use this to filter by request body or other request properties
   */
  async waitForQueryDataRequest(cb?: (request: Request) => boolean | Promise<boolean>) {
    return this.ctx.page.waitForRequest((request) => {
      if (request.url().includes(this.ctx.selectors.apis.DataSource.query) && request.method() === 'POST') {
        return cb ? cb(request) : true;
      }
      return false;
    });
  }

  /**
   * Waits for a data source query data response
   *
   * @param cb optional callback to filter the response. Use this to filter by response body or other response properties
   */
  async waitForQueryDataResponse(cb?: (request: Response) => boolean | Promise<boolean>) {
    return this.ctx.page.waitForResponse((response) => {
      if (response.url().includes(this.ctx.selectors.apis.DataSource.query)) {
        return cb ? cb(response) : true;
      }
      return false;
    });
  }
}
