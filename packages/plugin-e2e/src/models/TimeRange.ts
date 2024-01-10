import { PluginTestCtx, TimeRangeArgs } from '../types';
import { GrafanaPage } from './GrafanaPage';

export class TimeRange extends GrafanaPage {
  constructor(ctx: PluginTestCtx) {
    super(ctx);
  }

  /**
   * Opens the time picker and sets the time range to the provided values
   */
  async set({ from, to, zone }: TimeRangeArgs) {
    try {
      await this.getByTestIdOrAriaLabel(this.ctx.selectors.components.TimePicker.openButton).click();
    } catch (e) {
      // seems like in older versions of Grafana the time picker markup is rendered twice
      await this.ctx.page.locator('[aria-controls="TimePickerContent"]').last().click();
    }

    if (zone) {
      //todo: add an e2e selector for the time zone picker and use it in grafana ui
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
  }
}
