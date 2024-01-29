import { expect, Locator, Response } from '@playwright/test';
import { DashboardEditViewArgs, NavigateOptions, PluginTestCtx, RequestOptions, Visualization } from '../types';
import { DataSourcePicker } from './DataSourcePicker';
import { GrafanaPage } from './GrafanaPage';
import { TimeRange } from './TimeRange';
import { Panel } from './Panel';

export class PanelEditPage extends GrafanaPage {
  datasource: DataSourcePicker;
  timeRange: TimeRange;
  panel: Panel;

  constructor(readonly ctx: PluginTestCtx, readonly args: DashboardEditViewArgs<string>) {
    super(ctx);
    this.datasource = new DataSourcePicker(ctx);
    this.timeRange = new TimeRange(ctx);
    this.panel = new Panel(
      ctx,
      // only one panel is allowed in the panel edit page, so we don't need to use panel title to locate it
      () => this.getByTestIdOrAriaLabel(ctx.selectors.components.Panels.Panel.title(''), { startsWith: true })
    );
  }

  /**
   * Navigates to the panel edit page. If a dashboard uid was not provided, it's assumed that it's a new dashboard.
   */
  async goto(options?: NavigateOptions) {
    const url = this.args.dashboard?.uid
      ? this.ctx.selectors.pages.Dashboard.url(this.args.dashboard.uid)
      : this.ctx.selectors.pages.AddDashboard.url;

    options ??= {};
    options.queryParams ??= new URLSearchParams();
    options.queryParams.append('editPanel', this.args.id);

    await super.navigate(url, options);
  }

  /**
   * Sets the title of the panel. This method will open the panel options, set the title and close the panel options.
   */
  async setPanelTitle(title: string) {
    const { OptionsGroup } = this.ctx.selectors.components;
    await this.collapseSection(OptionsGroup.groupTitle);
    //TODO: add new selector and use it in grafana/ui
    const vizInput = await this.getByTestIdOrAriaLabel(OptionsGroup.group(OptionsGroup.groupTitle))
      .locator('input')
      .first();
    await vizInput.fill(title);
    await this.ctx.page.keyboard.press('Tab');
  }
  /**
   * Sets the visualization for the panel. This method will open the visualization picker, select the given visualization
   */
  async setVisualization(visualization: Visualization) {
    // toggle options pane if panel edit is not visible
    const showPanelEditElement = this.getByTestIdOrAriaLabel('Show options pane');
    const showPanelEditElementCount = await showPanelEditElement.count();
    if (showPanelEditElementCount > 0) {
      await showPanelEditElement.click();
    }
    await this.getByTestIdOrAriaLabel(this.ctx.selectors.components.PanelEditor.toggleVizPicker).click();
    await this.getByTestIdOrAriaLabel(this.ctx.selectors.components.PluginVisualization.item(visualization)).click();
    await expect(
      this.getByTestIdOrAriaLabel(this.ctx.selectors.components.PanelEditor.toggleVizPicker),
      `Could not set visualization to ${visualization}. Ensure the panel is installed.`
    ).toHaveText(visualization);
  }

  /**
   * Expands the section for the given category name. If the section is already expanded, this method does nothing.
   */
  async collapseSection(categoryName: string) {
    const section = this.getByTestIdOrAriaLabel(this.ctx.selectors.components.OptionsGroup.group(categoryName));
    await expect(section, `Could not find any section for category: ${categoryName}`).toBeVisible();
    const sectionToggle = this.getByTestIdOrAriaLabel(this.ctx.selectors.components.OptionsGroup.toggle(categoryName));
    const expandedAttr = (await sectionToggle.getAttribute('aria-expanded')) ?? '';
    if (/false/.test(expandedAttr)) {
      await section.click();
    }
  }

  /**
   * Returns the name of the visualization currently selected in the panel editor
   */
  getVisualizationName(): Locator {
    return this.getByTestIdOrAriaLabel(this.ctx.selectors.components.PanelEditor.toggleVizPicker);
  }

  /**
   * Clicks the "Apply" button in the panel editor
   */
  async apply() {
    await this.ctx.page.getByTestId(this.ctx.selectors.components.PanelEditor.applyButton).click();
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
   * Clicks the "Refresh" button in the panel editor. Returns the response promise for the data query
   * 
   * By default, this method will wait for any response that has the url '/api/ds/query'. 
   * If you need to wait for a specific response, you can pass a callback to the `waitForResponsePredicateCallback` option.
   * e.g
   * panelEditPage.refreshPanel({
      waitForResponsePredicateCallback: (r) =>
        r.url().includes(selectors.apis.DataSource.query) &&
        r.body().then((body) => body.includes(`"status":"finished"`)),
    })
   */
  async refreshPanel(options?: RequestOptions) {
    const defaultPredicate = (resp: Response) => resp.url().includes(this.ctx.selectors.apis.DataSource.query);
    const responsePromise = this.ctx.page.waitForResponse(
      options?.waitForResponsePredicateCallback ?? defaultPredicate,
      options
    );

    // in older versions of grafana, the refresh button is rendered twice. this is a workaround to click the correct one
    const refreshPanelButton = this.getByTestIdOrAriaLabel(
      this.ctx.selectors.components.PanelEditor.General.content
    ).locator(`selector=${this.ctx.selectors.components.RefreshPicker.runButtonV2}`);

    await refreshPanelButton.click();

    return responsePromise;
  }
}
