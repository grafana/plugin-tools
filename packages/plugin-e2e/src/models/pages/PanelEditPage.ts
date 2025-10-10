import * as semver from 'semver';
import { expect, Locator, Response } from '@playwright/test';
import { DashboardEditViewArgs, NavigateOptions, PluginTestCtx, RequestOptions, Visualization } from '../../types';
import { DataSourcePicker } from '../components/DataSourcePicker';
import { GrafanaPage } from './GrafanaPage';
import { TimeRange } from '../components/TimeRange';
import { Panel } from '../components/Panel';
import { radioButtonSetChecked } from '../utils';
import { DashboardPage } from './DashboardPage';
import { PanelEditOptionsGroup } from '../components/PanelEditOptionsGroup';

export class PanelEditPage extends GrafanaPage {
  datasource: DataSourcePicker;
  timeRange: TimeRange;
  panel: Panel;

  constructor(
    readonly ctx: PluginTestCtx,
    readonly args: DashboardEditViewArgs<string>
  ) {
    super(ctx, args);
    this.datasource = new DataSourcePicker(ctx);
    this.timeRange = new TimeRange(ctx);
    this.panel = new Panel(ctx, this.getPanelLocator());
  }

  private getPanelLocator() {
    // only one panel is allowed in the panel edit page, so we don't need to use panel title to locate it
    const locator = this.getByGrafanaSelector(this.ctx.selectors.components.Panels.Panel.title(''), {
      startsWith: true,
    });
    // in older versions, the panel selector is added to a child element, so we need to go up two levels to get the wrapper
    if (semver.lt(this.ctx.grafanaVersion, '9.5.0')) {
      return locator.locator('..').locator('..');
    }
    return locator;
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

  async toggleTableView() {
    await radioButtonSetChecked(this.ctx.page, 'Table view', true);
    let locator = this.getByGrafanaSelector(this.ctx.selectors.components.Panels.Panel.title(''));
    if (semver.lt(this.ctx.grafanaVersion, '10.4.0')) {
      locator = this.ctx.page.getByRole('table');
    }
    this.panel = new Panel(this.ctx, locator);
  }

  async untoggleTableView() {
    await radioButtonSetChecked(this.ctx.page, 'Table view', false);
    this.panel = new Panel(
      this.ctx,
      this.getByGrafanaSelector(this.ctx.selectors.components.Panels.Panel.title(''), { startsWith: true })
    );
  }

  /**
   * Sets the title of the panel. This method will open the panel options, set the title and close the panel options.
   */
  async setPanelTitle(titleText: string) {
    const TITLE = 'Title';
    const { OptionsGroup, PanelEditor } = this.ctx.selectors.components;
    const sectionGroupTitle = 'Panel options';
    await this.collapseSection(sectionGroupTitle);

    const vizInput = semver.gte(this.ctx.grafanaVersion, '11.0.0')
      ? this.getByGrafanaSelector(PanelEditor.OptionsPane.fieldInput(TITLE))
      : this.getByGrafanaSelector(OptionsGroup.group(sectionGroupTitle)).locator('input').first();
    await vizInput.fill(titleText);
    await this.ctx.page.keyboard.press('Tab');
  }

  /**
   * Sets the visualization for the panel. This method will open the visualization picker, select the given visualization
   */
  async setVisualization(visualization: Visualization | string) {
    const showPanelEditElement = this.getByGrafanaSelector('Show options pane');
    const showPanelEditElementCount = await showPanelEditElement.count();
    if (showPanelEditElementCount > 0) {
      await showPanelEditElement.click();
    }
    await this.getByGrafanaSelector(this.ctx.selectors.components.PanelEditor.toggleVizPicker).click();
    await this.getByGrafanaSelector(this.ctx.selectors.components.PluginVisualization.item(visualization)).click();
    await expect(
      this.getByGrafanaSelector(this.ctx.selectors.components.PanelEditor.toggleVizPicker),
      `Could not set visualization to ${visualization}. Ensure the panel is installed.`
    ).toHaveText(visualization);
  }

  /**
   * Expands the section for the given category name. If the section is already expanded, this method does nothing.
   * @deprecated use {@link PanelEditOptionsGroup.expand} method instead.
   */
  async collapseSection(categoryName: string) {
    const section = this.getByGrafanaSelector(this.ctx.selectors.components.OptionsGroup.group(categoryName));
    await expect(section, `Could not find any section for category: ${categoryName}`).toBeVisible();
    const sectionToggle = this.getByGrafanaSelector(this.ctx.selectors.components.OptionsGroup.toggle(categoryName));
    const expandedAttr = (await sectionToggle.getAttribute('aria-expanded')) ?? '';
    if (/false/.test(expandedAttr)) {
      await section.click();
    }
  }

  /**
   * Returns the name of the visualization currently selected in the panel editor
   */
  getVisualizationName(): Locator {
    return this.getByGrafanaSelector(this.ctx.selectors.components.PanelEditor.toggleVizPicker);
  }

  /**
   * Clicks the "Back to dashboard" button in the panel editor
   * In versions prior to 11.3.0, this method clicks the "Apply" button instead
   */
  async backToDashboard() {
    if (semver.gte(this.ctx.grafanaVersion, '11.3.0')) {
      await this.getByGrafanaSelector(
        this.ctx.selectors.components.NavToolbar.editDashboard.backToDashboardButton
      ).click();
    } else {
      await this.getByGrafanaSelector(this.ctx.selectors.components.PanelEditor.applyButton).click();
    }

    return new DashboardPage(this.ctx, this.args);
  }

  /**
   * Clicks the "Apply" button in the panel editor
   *
   * @deprecated use {@link PanelEditPage.backToDashboard} method instead.
   */
  async apply() {
    return this.backToDashboard();
  }

  /**
   * Returns the locator for the query editor row with the given refId
   */
  getQueryEditorRow(refId: string): Locator {
    return this.getByGrafanaSelector(this.ctx.selectors.components.QueryEditorRows.rows).filter({
      has: this.getByGrafanaSelector(this.ctx.selectors.components.QueryEditorRow.title(refId)),
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
    const refreshPanelButton = this.getByGrafanaSelector(this.ctx.selectors.components.RefreshPicker.runButtonV2, {
      root: this.getByGrafanaSelector(this.ctx.selectors.components.PanelEditor.General.content),
    });

    try {
      await expect(refreshPanelButton).toBeVisible();
      // if the refreshPanelButton has the text 'Cancel', then wait until it says Refresh otherwise we'll cancel all the ongoing requests
      await expect(refreshPanelButton).toHaveText(/refresh/i, { timeout: 2000 });
      await refreshPanelButton.click({ timeout: 2000 });
    } catch (error) {
      // refresh button may be hidden behind the visualization options
      await this.getByGrafanaSelector(this.ctx.selectors.components.PanelEditor.toggleVizOptions).click();
      await refreshPanelButton.click();
      await this.getByGrafanaSelector(this.ctx.selectors.components.PanelEditor.toggleVizOptions).click();
    }

    return responsePromise;
  }

  /** Return page object for the panel edit options group with the given label */
  getCustomOptions(label: string): PanelEditOptionsGroup {
    const locator = this.getOptionsGroupLocator(label);
    return new PanelEditOptionsGroup(this.ctx, locator, label);
  }

  getPanelOptions(): PanelEditOptionsGroup {
    return this.getCustomOptions('Panel options');
  }

  getStandardOptions(): PanelEditOptionsGroup {
    return this.getCustomOptions('Standard options');
  }

  getValueMappingOptions(): PanelEditOptionsGroup {
    return this.getCustomOptions('Value mappings');
  }

  getDataLinksOptions(): PanelEditOptionsGroup {
    return this.getCustomOptions('Data links');
  }

  getThresholdsOptions(): PanelEditOptionsGroup {
    return this.getCustomOptions('Thresholds');
  }

  private getOptionsGroupLocator(label: string): Locator {
    const { selectors } = this.ctx;
    return this.getByGrafanaSelector(selectors.components.OptionsGroup.group(label));
  }
}
