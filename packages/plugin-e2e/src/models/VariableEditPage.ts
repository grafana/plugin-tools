const gte = require('semver/functions/gte');

import { PluginTestCtx } from '../types';
import { DataSourcePicker } from './DataSourcePicker';
import { GrafanaPage } from './GrafanaPage';
import { PanelEditPage } from './PanelEditPage';

export type VariableType = 'Query' | 'Constant' | 'Custom';

export class VariableEditPage extends GrafanaPage {
  datasource: DataSourcePicker;
  constructor(ctx: PluginTestCtx) {
    super(ctx);
    this.datasource = new DataSourcePicker(ctx);
  }

  async setVariableType(type: VariableType) {
    await this.getByTestIdOrAriaLabel(
      this.ctx.selectors.pages.Dashboard.Settings.Variables.Edit.General.generalTypeSelectV2
    )
      .locator('input')
      .fill(type);
    await this.ctx.page.keyboard.press('ArrowDown');
    await this.ctx.page.keyboard.press('Enter');
    await this.getByTestIdOrAriaLabel(
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
    if (gte(this.ctx.grafanaVersion, '9.2.0')) {
      await this.getByTestIdOrAriaLabel(
        this.ctx.selectors.pages.Dashboard.Settings.Variables.Edit.General.submitButton
      ).click();
    } else {
      // in 9.1.3, the submit button submits the form
      await this.ctx.page.keyboard.press('Tab');
    }
  }
}
