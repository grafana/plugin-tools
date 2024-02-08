const semver = require('semver');
import { Locator, expect } from '@playwright/test';
import { NavigateOptions, PluginTestCtx, RequestOptions } from '../types';
import { DataSourcePicker } from './DataSourcePicker';
import { GrafanaPage } from './GrafanaPage';
import { TimeRange } from './TimeRange';
import { Panel } from './Panel';

const TIME_SERIES_PANEL_SELECTOR_SUFFIX = 'Graph';
const TABLE_PANEL_SELECTOR_SUFFIX = 'Table';
const LOGS_PANEL_SELECTOR_SUFFIX = 'Logs';
const TIME_SERIES_PANEL_TEXT = 'Graph Lines Bars Points';
const TABLE_PANEL_TEXT = 'Table';
const LOGS_PANEL_TEXT = 'Logs';

export class ExplorePage extends GrafanaPage {
  datasource: DataSourcePicker;
  timeRange: any;
  timeSeriesPanel: Panel;
  tablePanel: Panel;

  constructor(ctx: PluginTestCtx) {
    super(ctx);
    this.datasource = new DataSourcePicker(ctx);
    this.timeRange = new TimeRange(ctx);
    this.timeSeriesPanel = new Panel(this.ctx, () => this.getTimeSeriesPanelLocator());
    this.tablePanel = new Panel(this.ctx, () => this.getTablePanelLocator());
  }

  private getTablePanelLocator() {
    let locator = this.ctx.page.getByTestId('Panel');
    if (semver.lt(this.ctx.grafanaVersion, '9.3.0')) {
      // seems there is no way to get the locator for the panels in Grafana versions < 9.3.0
      throw new Error(`Can't locate panels on Explore page for Grafana versions < 9.3.0. Please skip this test.`);
    } else if (semver.lt(this.ctx.grafanaVersion, '10.0.0')) {
      // having to use these selectors is unfortunate, but the Explore page did not use data-testid on the panels before Grafana 10.
      locator = this.ctx.page.getByRole('button', { name: TABLE_PANEL_TEXT }).locator('..');
    } else if (semver.lt(this.ctx.grafanaVersion, '10.4.0')) {
      locator = this.getByTestIdOrAriaLabel(
        this.ctx.selectors.components.Panels.Panel.title(TABLE_PANEL_SELECTOR_SUFFIX),
        {
          startsWith: true,
        }
      );
    }

    return locator;
  }

  private getTimeSeriesPanelLocator() {
    let locator = this.getByTestIdOrAriaLabel(
      this.ctx.selectors.components.Panels.Panel.title(TIME_SERIES_PANEL_SELECTOR_SUFFIX),
      {
        startsWith: true,
      }
    );

    if (semver.lt(this.ctx.grafanaVersion, '9.3.0')) {
      // seems there is no way to get the locator for the panels in Grafana versions < 9.3.0
      throw new Error(`Can't locate panels on Explore page for Grafana versions < 9.3.0. Please skip this test.`);
    } else if (semver.lt(this.ctx.grafanaVersion, '10.0.0')) {
      // having to use these selectors is unfortunate, but the Explore page did not use data-testid on the panels before Grafana 10.
      locator = this.ctx.page.getByRole('button', { name: TIME_SERIES_PANEL_TEXT }).locator('..');
    }

    return locator;
  }

  /**
   * Navigates to the explore page.
   */
  async goto(options?: NavigateOptions) {
    await super.navigate(this.ctx.selectors.pages.Explore.url, options);
  }

  /**
   * Returns the locator for the query editor row with the given refId
   */
  getQueryEditorRow(refId: string): Locator {
    return this.getByTestIdOrAriaLabel(this.ctx.selectors.components.QueryEditorRows.rows).filter({
      has: this.getByTestIdOrAriaLabel(this.ctx.selectors.components.QueryEditorRow.title(refId)),
    });
  }

  /**
   * Clicks the "Run Query" button in the refresh picker to run the query. Returns the response promise for the data query
   */
  async runQuery(options?: RequestOptions) {
    const components = this.ctx.selectors.components;
    const responsePromise = this.ctx.page.waitForResponse(
      (resp) => resp.url().includes(this.ctx.selectors.apis.DataSource.query),
      options
    );
    try {
      await this.getByTestIdOrAriaLabel(components.RefreshPicker.runButtonV2).click({
        timeout: 1000,
      });
    } catch (_) {
      // handle the case when the run button is hidden behind the "Show more items" button
      await this.getByTestIdOrAriaLabel(components.PageToolbar.item(components.PageToolbar.shotMoreItems)).click();
      await this.getByTestIdOrAriaLabel(components.RefreshPicker.runButtonV2).last().click();
    }
    return responsePromise;
  }
}
