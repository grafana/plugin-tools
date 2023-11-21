import { Expect, Locator, Request } from '@playwright/test';
import { PluginTestCtx } from '../types';

/**
 * Base class for all Grafana pages.
 *
 * Exposes methods for locating Grafana specific elements on the page
 */
export abstract class GrafanaPage {
  constructor(public readonly ctx: PluginTestCtx, protected readonly expect: Expect<any>) {}

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
    await this.ctx.page.route('*/**/api/ds/query*', async (route) => {
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
    await this.ctx.page.route(`${this.ctx.selectors.apis.DataSource.resource}/${path}`, async (route) => {
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
      if (request.url().includes('api/ds/query') && request.method() === 'POST') {
        return cb ? cb(request) : true;
      }
      return false;
    });
  }
}
