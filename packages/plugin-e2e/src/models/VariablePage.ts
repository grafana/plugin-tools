import { PluginTestCtx } from '../types';
import { GrafanaPage } from './GrafanaPage';
import { VariableEditPage } from './VariableEditPage';

export class VariablePage extends GrafanaPage {
  constructor(ctx: PluginTestCtx) {
    super(ctx);
  }

  async goto() {
    await this.ctx.page.goto(this.ctx.selectors.pages.AddDashboard.Variables.url, {
      waitUntil: 'networkidle',
    });
  }

  async clickAddNew() {
    const { addVariableCTAV2, addVariableCTAV2Item, newButton } =
      this.ctx.selectors.pages.Dashboard.Settings.Variables.List;
    try {
      const ctaSelector = this.getByTestIdOrAriaLabel(addVariableCTAV2(addVariableCTAV2Item));
      await ctaSelector.waitFor();
      await ctaSelector.click();
    } catch (error) {
      await this.getByTestIdOrAriaLabel(newButton).click();
    }

    return new VariableEditPage(this.ctx);
  }
}
