import { Locator, expect } from '@playwright/test';
import { NavigateOptions, PluginTestCtx, RequestOptions } from '../types';
import { DataSourcePicker } from './DataSourcePicker';
import { GrafanaPage } from './GrafanaPage';
import { TimeRange } from './TimeRange';

const SHOW_MORE_ITEMS = 'Show more items';

export class ExplorePage extends GrafanaPage {
  datasource: DataSourcePicker;
  timeRange: any;
  constructor(ctx: PluginTestCtx) {
    super(ctx);
    this.datasource = new DataSourcePicker(ctx);
    this.timeRange = new TimeRange(ctx);
  }

  async goto(options?: NavigateOptions) {
    await super.navigate(this.ctx.selectors.pages.Explore.url, options);
  }

  async getQueryEditorRow(refId: string): Promise<Locator> {
    //TODO: add new selector and use it in grafana/ui
    const locator = this.ctx.page.locator('[aria-label="Query editor row"]').filter({
      has: this.ctx.page.locator(`[aria-label="Query editor row title ${refId}"]`),
    });
    await expect(locator).toBeVisible();
    return locator;
  }

  async runQuery(options?: RequestOptions) {
    const components = this.ctx.selectors.components;
    const responsePromise = this.ctx.page.waitForResponse((resp) => resp.url().includes('/api/ds/query'), options);
    try {
      await this.getByTestIdOrAriaLabel(components.RefreshPicker.runButtonV2).click({
        timeout: 1000,
      });
    } catch (_) {
      // handle the case when the run button is hidden behind the "Show more items" button
      await this.getByTestIdOrAriaLabel(components.PageToolbar.item(SHOW_MORE_ITEMS)).click();
      await this.getByTestIdOrAriaLabel(components.RefreshPicker.runButtonV2).last().click();
    }
    return responsePromise;
  }
}
