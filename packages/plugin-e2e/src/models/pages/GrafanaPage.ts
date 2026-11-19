import { Locator, Request, Response } from '@playwright/test';
import { getByGrafanaSelectorOptions, GrafanaPageArgs, NavigateOptions, PluginTestCtx } from '../../types';
import { resolveGrafanaSelector } from '../utils';
import { isAppPlatformQueryUrl, isDataQueryUrl } from '../../utils/dataSourceRequests';

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
   * Get a locator based on a Grafana E2E selector. A grafana E2E selector is defined in Grafana's @grafana/e2e-selectors package or in plugin-e2e/src/selectors.
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
    // queries go to the query apiserver instead when the querier feature flags are on
    // routed with the matcher the waiters use, so a query is mocked whatever its query string
    await this.ctx.page.route(
      (url) => isAppPlatformQueryUrl(url.href, this.ctx.selectors.apis.DataSource.appPlatformQueryPattern),
      async (route) => {
        await route.fulfill({ json, status });
      }
    );
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
    // resources go to the datasource apiserver instead when the apiserver feature flags are on
    await this.ctx.page.route(
      `${this.ctx.selectors.apis.DataSource.appPlatformResourcePattern}/${path}`,
      async (route) => {
        await route.fulfill({ json, status });
      }
    );
  }

  /**
   * Waits for a data source query data request to be made.
   *
   * @param cb optional callback to filter the request. Use this to filter by request body or other request properties
   */
  async waitForQueryDataRequest(cb?: (request: Request) => boolean | Promise<boolean>) {
    return this.ctx.page.waitForRequest((request) => {
      if (isDataQueryUrl(request.url(), this.ctx.selectors.apis.DataSource) && request.method() === 'POST') {
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
      if (isDataQueryUrl(response.url(), this.ctx.selectors.apis.DataSource)) {
        return cb ? cb(response) : true;
      }
      return false;
    });
  }

  /**
   * Waits for a data source query data response and returns both the response and its parsed JSON body.
   *
   * The body is read while the response is still live, inside the same predicate `waitForResponse` uses
   * to find the matching response, rather than by calling `.json()` on the resolved response afterwards.
   *
   * @param cb optional callback to filter the response. Receives the response together with its parsed
   * body (`null` if the body could not be parsed as JSON) so you can filter by response contents, e.g. a
   * specific refId's frames, rather than only status or url.
   *
   * @alpha - the API is not yet stable and may change without a major version bump. Use with caution.
   */
  async waitForQueryDataResponseWithBody<T = any>(
    cb?: (response: Response, body: T | null) => boolean | Promise<boolean>
  ): Promise<{ response: Response; body: T | null }> {
    let body: T | null = null;
    const response = await this.ctx.page.waitForResponse(async (response) => {
      if (!isDataQueryUrl(response.url(), this.ctx.selectors.apis.DataSource)) {
        return false;
      }
      const parsedBody = (await response.json().catch(() => null)) as T | null;
      if (cb && !(await cb(response, parsedBody))) {
        return false;
      }
      body = parsedBody;
      return true;
    });
    return { response, body };
  }
}
