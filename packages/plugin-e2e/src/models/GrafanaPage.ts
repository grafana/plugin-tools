import { Locator, Request, Response } from '@playwright/test';
import { NavigateOptions, PluginTestCtx } from '../types';

/**
 * Base class for all Grafana pages.
 *
 * Exposes methods for locating Grafana specific elements on the page
 */
export abstract class GrafanaPage {
  constructor(public readonly ctx: PluginTestCtx) {}

  protected async navigate(url: string, options?: NavigateOptions) {
    if (options?.queryParams) {
      url += `?${options.queryParams.toString()}`;
    }
    await this.ctx.page.goto(url, {
      waitUntil: 'networkidle',
      ...options,
    });
  }

  /**
   * Get a locator for a Grafana element by data-testid or aria-label
   * @param selector the data-testid or aria-label of the element
   * @param root optional root locator to search within. If no locator is provided, the page will be used
   */
  getByTestIdOrAriaLabel(selector: string, root?: Locator): Locator {
    if (selector.startsWith('data-testid')) {
      return (root || this.ctx.page).getByTestId(selector);
    }

    return (root || this.ctx.page).locator(`[aria-label="${selector}"]`);
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
   * Mocks the response of the datasource resource request
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
