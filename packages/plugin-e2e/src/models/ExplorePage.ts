import { Expect, Locator } from '@playwright/test';
import { NavigateOptions, PluginTestCtx, RequestOptions } from '../types';
import { DataSourcePicker } from './DataSourcePicker';
import { GrafanaPage } from './GrafanaPage';
import { TimeRange } from './TimeRange';

export class ExplorePage extends GrafanaPage {
  datasource: DataSourcePicker;
  timeRange: any;
  constructor(ctx: PluginTestCtx, expect: Expect<any>) {
    super(ctx, expect);
    this.datasource = new DataSourcePicker(ctx, expect);
    this.timeRange = new TimeRange(ctx, this.expect);
  }

  async goto(options?: NavigateOptions) {
    await super.navigate(this.ctx.selectors.pages.Explore.url, options);
  }

  async getQueryEditorRow(refId: string): Promise<Locator> {
    //TODO: add new selector and use it in grafana/ui
    const locator = this.ctx.page.locator('[aria-label="Query editor row"]').filter({
      has: this.ctx.page.locator(`[aria-label="Query editor row title ${refId}"]`),
    });
    await this.expect(locator).toBeVisible();
    return locator;
  }

  async runQuery(options?: RequestOptions) {
    const components = this.ctx.selectors.components;
    const runButtonTextContent = await this.getByTestIdOrAriaLabel(components.RefreshPicker.runButtonV2).textContent();
    // if there is a query running, wait for it to finish before starting a new one
    if (runButtonTextContent === 'Cancel') {
      await this.ctx.page.waitForResponse((resp) => resp.url().includes('/api/ds/query'), options);
    }

    const responsePromise = this.ctx.page.waitForResponse((resp) => resp.url().includes('/api/ds/query'), options);
    try {
      await this.getByTestIdOrAriaLabel(components.RefreshPicker.runButtonV2).click({
        timeout: 1000,
      });
    } catch (_) {
      // handle the case when the run button is hidden behind the "Show more items" button
      await this.getByTestIdOrAriaLabel(components.PageToolbar.item('Show more items')).click();
      await this.getByTestIdOrAriaLabel(components.RefreshPicker.runButtonV2).last().click();
    }
    return responsePromise;
  }
}
