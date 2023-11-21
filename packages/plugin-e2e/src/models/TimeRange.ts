import { Expect } from '@playwright/test';
import { PluginTestCtx, TimeRangeArgs } from '../types';
import { GrafanaPage } from './GrafanaPage';

export class TimeRange extends GrafanaPage {
  constructor(ctx: PluginTestCtx, expect: Expect<any>) {
    super(ctx, expect);
  }

  async set({ from, to, zone }: TimeRangeArgs) {
    try {
      await this.ctx.page
        .getByLabel(this.ctx.selectors.components.PanelEditor.General.content)
        .locator(`selector=${this.ctx.selectors.components.TimePicker.openButton}`)
        .click({ force: true, timeout: 2000 });
    } catch (e) {
      // seems like in older versions of Grafana the time picker markup is rendered twice
      await this.ctx.page.locator('[aria-controls="TimePickerContent"]').last().click();
    }

    if (zone) {
      await this.ctx.page.getByRole('button', { name: 'Change time settings' }).click();
      await this.getByTestIdOrAriaLabel(this.ctx.selectors.components.TimeZonePicker.containerV2).fill(zone);
    }
    await this.getByTestIdOrAriaLabel(this.ctx.selectors.components.TimePicker.absoluteTimeRangeTitle).click();
    const fromField = await this.getByTestIdOrAriaLabel(this.ctx.selectors.components.TimePicker.fromField);
    await fromField.clear();
    await fromField.fill(from);
    const toField = await this.getByTestIdOrAriaLabel(this.ctx.selectors.components.TimePicker.toField);
    await toField.clear();
    await toField.fill(to);
    await this.getByTestIdOrAriaLabel(this.ctx.selectors.components.TimePicker.applyTimeRange).click();

    await this.expect
      .soft(
        this.ctx.page.getByLabel(this.ctx.selectors.components.PanelEditor.General.content).getByText(from),
        'Could not set "from" in dashboard time range picker'
      )
      .toBeVisible();
    await this.expect
      .soft(
        this.ctx.page.getByLabel(this.ctx.selectors.components.PanelEditor.General.content).getByText(to),
        'Could not set "to" in dashboard time range picker'
      )
      .toBeVisible();
  }
}
