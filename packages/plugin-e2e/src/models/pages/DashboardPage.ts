import * as semver from 'semver';
import { DashboardPageArgs, NavigateOptions, PluginTestCtx } from '../../types';
import { DataSourcePicker } from '../components/DataSourcePicker';
import { GrafanaPage } from './GrafanaPage';
import { PanelEditPage } from './PanelEditPage';
import { TimeRange } from '../components/TimeRange';
import { Panel } from '../components/Panel';
import { isFeatureEnabled } from '../../fixtures/isFeatureToggleEnabled';

export class DashboardPage extends GrafanaPage {
  dataSourcePicker: any;
  timeRange: TimeRange;

  constructor(
    readonly ctx: PluginTestCtx,
    readonly dashboard?: DashboardPageArgs
  ) {
    super(ctx, dashboard);
    this.dataSourcePicker = new DataSourcePicker(ctx);
    this.timeRange = new TimeRange(ctx);
  }

  /**
   * Navigates to the dashboard page. If a dashboard uid was not provided, it's assumed that it's a new dashboard.
   */
  async goto(options: NavigateOptions = {}) {
    let url = this.dashboard?.uid
      ? this.ctx.selectors.pages.Dashboard.url(this.dashboard.uid)
      : this.ctx.selectors.pages.AddDashboard.url;

    if (this.dashboard?.timeRange) {
      options.queryParams = options?.queryParams ?? new URLSearchParams();
      options.queryParams.append('from', this.dashboard.timeRange.from);
      options.queryParams.append('to', this.dashboard.timeRange.to);
    }

    return super.navigate(url, options);
  }

  /**
   * Navigates to the panel edit page for the given panel id
   *
   * If the panel id does not exist in the dashboard, Grafana will redirect to the dashboard page
   */
  async gotoPanelEditPage(panelId: string) {
    const panelEditPage = new PanelEditPage(this.ctx, { dashboard: this.dashboard, id: panelId });
    await panelEditPage.goto();
    return panelEditPage;
  }

  /**
   * Returns a Panel object for the panel with the given title. Only works for panels that currently are in the viewport.
   *
   * Note that this won't navigate to the panel edit page, it will only return the Panel object, which
   * points to the locator for the panel in the dashboard page. Can be used to assert on the panel data, eg.
   * const panel = await dashboardPage.getPanelByTitle('Table panel');
   * await expect(panel.fieldNames).toContainText(['time', 'temperature']);
   */
  getPanelByTitle(title: string): Panel {
    let locator = this.getByGrafanaSelector(this.ctx.selectors.components.Panels.Panel.title(title));
    // in older versions, the panel selector is added to a child element, so we need to go up two levels to get the wrapper
    if (semver.lt(this.ctx.grafanaVersion, '9.5.0')) {
      locator = locator.locator('..').locator('..');
    }
    return new Panel(this.ctx, locator);
  }

  /**
   * Returns a Panel object for the panel with the given id. Only works for panels that currently are in the viewport.
   *
   * Note that this won't navigate to the panel edit page, it will only return the Panel object, which
   * points to the locator for the panel in the dashboard page. Can be used to assert on the panel data, eg.
   * const panel = await dashboardPage.getPanelByTitle('2');
   * await expect(panel.fieldNames()).toContainText(['time', 'temperature']);
   */
  getPanelById(panelId: string): Panel {
    if (semver.lt(this.ctx.grafanaVersion, '11.3.0')) {
      return new Panel(this.ctx, this.ctx.page.locator(`[data-panelid="${panelId}"]`));
    }

    return new Panel(this.ctx, this.ctx.page.locator(`[data-viz-panel-key="panel-${panelId}"]`));
  }

  /**
   * Clicks the buttons to add a new panel and returns the panel edit page for the new panel
   */
  async addPanel(): Promise<PanelEditPage> {
    const { components, pages, constants } = this.ctx.selectors;

    const scenesEnabled = await isFeatureEnabled(this.ctx.page, 'dashboardScene');

    // In scenes powered dashboards, one needs to click the edit button before adding a new panel in already existing dashboards
    if (scenesEnabled && this.dashboard?.uid) {
      await this.getByGrafanaSelector(components.NavToolbar.editDashboard.editButton).click();
    }
    // on small screens, the toolbar buttons are hidden behind a "Show more items" button
    const viewportDimensions = await this.ctx.page.viewportSize();
    let toolbarButtonsHidden = false;

    if (viewportDimensions && viewportDimensions.width <= 620) {
      const showMoreItems = await this.ctx.page.getByLabel('Show more items');
      toolbarButtonsHidden = !scenesEnabled && (await showMoreItems.count()) > 0;
      if (toolbarButtonsHidden) {
        await showMoreItems.click();
      }
    }

    if (semver.gte(this.ctx.grafanaVersion, '9.5.0')) {
      let addButton = this.getByGrafanaSelector(
        components.PageToolbar.itemButton(constants.PageToolBar.itemButtonTitle)
      );
      toolbarButtonsHidden ? await addButton.last().click() : await addButton.click();
      await this.getByGrafanaSelector(pages.AddDashboard.itemButton(pages.AddDashboard.itemButtonAddViz)).click();
    } else {
      if (this.dashboard?.uid) {
        const addPanelButton = this.getByGrafanaSelector(components.PageToolbar.item('Add panel'));
        toolbarButtonsHidden ? await addPanelButton.last().click() : await addPanelButton.click();
      }
      await this.getByGrafanaSelector(pages.AddDashboard.addNewPanel).click();
    }

    const panelId = await this.ctx.page.evaluate(() => {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('editPanel');
    });

    return new PanelEditPage(this.ctx, { dashboard: this.dashboard, id: panelId ?? '1' });
  }

  /**
   * Deletes the dashboard
   */
  async deleteDashboard() {
    if (this.dashboard?.uid) {
      await this.ctx.request.delete(this.ctx.selectors.apis.Dashboard.delete(this.dashboard.uid));
    }
  }

  /**
   * Clicks the run button in the refresh picker to refresh the dashboard
   */
  async refreshDashboard() {
    await this.ctx.page.getByTestId(this.ctx.selectors.components.RefreshPicker.runButtonV2).click();
  }
}
