import { PluginTestCtx } from '../types';
import { GrafanaPage } from './GrafanaPage';
import { VariableEditPage } from './VariableEditPage';

export class VariablePage extends GrafanaPage {
  constructor(ctx: PluginTestCtx) {
    super(ctx);
  }

  async goto() {
    //TODO: use selector instead
    await this.ctx.page.goto('dashboard/new?orgId=1&editview=templating', {
      waitUntil: 'networkidle',
    });
  }

  async clickAddNew() {
    const { Dashboard } = this.ctx.selectors.pages;
    try {
      const ctaSelector = this.getByTestIdOrAriaLabel(
        Dashboard.Settings.Variables.List.addVariableCTAV2('Add variable')
      );
      await ctaSelector.waitFor();
      await ctaSelector.click();
    } catch (error) {
      await this.getByTestIdOrAriaLabel(Dashboard.Settings.Variables.List.newButton).click();
    }

    return new VariableEditPage(this.ctx);
  }
}
