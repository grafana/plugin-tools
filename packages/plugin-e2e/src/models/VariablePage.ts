import { DashboardPageArgs, NavigateOptions, PluginTestCtx } from '../types';
import { GrafanaPage } from './GrafanaPage';
import { VariableEditPage } from './VariableEditPage';

export class VariablePage extends GrafanaPage {
  constructor(readonly ctx: PluginTestCtx, readonly dashboard?: DashboardPageArgs) {
    super(ctx);
  }

  /**
   * Navigates to the variable list page. If a dashboard uid was not provided, it's assumed that it's a new dashboard.
   */
  async goto(options?: NavigateOptions) {
    const { Dashboard, AddDashboard } = this.ctx.selectors.pages;
    let url = this.dashboard?.uid
      ? Dashboard.Settings.Variables.List.url(this.dashboard.uid)
      : AddDashboard.Settings.Variables.List.url;

    return super.navigate(url, options);
  }

  /**
   * Clicks the add new variable button and returns the variable edit page
   */
  async clickAddNew() {
    const { addVariableCTAV2, addVariableCTAV2Item, newButton } =
      this.ctx.selectors.pages.Dashboard.Settings.Variables.List;

    if (!this.dashboard?.uid) {
      await this.getByTestIdOrAriaLabel(addVariableCTAV2(addVariableCTAV2Item)).click();
    } else {
      await this.getByTestIdOrAriaLabel(newButton).click();
    }

    const editIndex = await this.ctx.page.evaluate(() => {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('editIndex');
    });

    return new VariableEditPage(this.ctx, { dashboard: this.dashboard, id: editIndex || '1' });
  }
}
