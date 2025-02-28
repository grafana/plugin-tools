import * as semver from 'semver';
import { DashboardEditViewArgs, NavigateOptions, PluginTestCtx } from '../../types';
import { DataSourcePicker } from '../components/DataSourcePicker';
import { GrafanaPage } from './GrafanaPage';
import { PanelEditPage } from './PanelEditPage';

export type VariableType = 'Query' | 'Constant' | 'Custom';

export class VariableEditPage extends GrafanaPage {
  datasource: DataSourcePicker;
  constructor(
    readonly ctx: PluginTestCtx,
    readonly args: DashboardEditViewArgs<string>
  ) {
    super(ctx, args);
    this.datasource = new DataSourcePicker(ctx);
  }

  /**
   * Navigates to the variable edit page. If a dashboard uid was not provided, it's assumed that it's a new dashboard.
   */
  async goto(options?: NavigateOptions) {
    const { Dashboard, AddDashboard } = this.ctx.selectors.pages;
    const url = this.args.dashboard?.uid
      ? `${Dashboard.url(this.args.dashboard.uid)}?${Dashboard.Settings.Variables.Edit.urlParams(this.args.id)}`
      : AddDashboard.Settings.Variables.Edit.url(this.args.id);

    await super.navigate(url, options);

    // In versions before 9.2.0, the variable index is not part of the URL so there's no way to navigate to it directly.
    // Instead, we have to click the nth row in the variable list to navigate to the edit page for a given variable index.
    if (semver.lt(this.ctx.grafanaVersion, '9.2.0') && this.args.id) {
      const list = this.getByGrafanaSelector(this.ctx.selectors.pages.Dashboard.Settings.Variables.List.table).locator(
        'tbody tr'
      );
      const variables = await list.all();
      await variables[Number(this.args.id)].click();
    }
  }

  /**
   * Sets the type of variable in the 'Variable type' dropdown to the given type
   */
  async setVariableType(type: VariableType) {
    await this.getByGrafanaSelector(
      this.ctx.selectors.pages.Dashboard.Settings.Variables.Edit.General.generalTypeSelectV2
    )
      .locator('input')
      .fill(type);
    await this.ctx.page.keyboard.press('ArrowDown');
    await this.ctx.page.keyboard.press('Enter');
    await this.getByGrafanaSelector(
      this.ctx.selectors.pages.Dashboard.Settings.Variables.Edit.General.generalTypeSelectV2
    ).scrollIntoViewIfNeeded();
  }

  /**
   * Triggers the variable query to run. Note that unlike {@link PanelEditPage.refreshPanel}, this method doesn't
   * return a request promise. This is because there's no canonical way of querying variables - data sources may
   * call any endpoint or resolve variables in the frontend. If you need to wait for a specific request, you can
   * do that in your test.
   * @example await this.ctx.page.waitForResponse((resp) => resp.url().includes('<url>')
   */
  async runQuery() {
    // in 9.2.0, the submit button got a new purpose. it no longer submits the form, but instead runs the query
    if (semver.gte(this.ctx.grafanaVersion, '9.2.0')) {
      await this.getByGrafanaSelector(
        this.ctx.selectors.pages.Dashboard.Settings.Variables.Edit.General.submitButton
      ).click();
    } else {
      // in version before 9.2.0, there's no submit button, so instead we click the "Include all" button to trigger the query
      const queryDataRequest = this.waitForQueryDataRequest();
      const includeAllSwitch = this.getByGrafanaSelector(
        this.ctx.selectors.pages.Dashboard.Settings.Variables.Edit.General.selectionOptionsIncludeAllSwitch
      ).locator('..');
      await includeAllSwitch.click();
      await queryDataRequest;
      await includeAllSwitch.click();
    }
  }
}
