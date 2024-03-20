import * as semver from 'semver';
import { PluginTestCtx, TimeRangeArgs } from '../../types';
import { GrafanaPage } from '../pages/GrafanaPage';

export class TimeRange extends GrafanaPage {
  constructor(ctx: PluginTestCtx) {
    super(ctx);
  }

  /**
   * Opens the time picker and sets the time range to the provided values
   */
  async set({ from, to, zone }: TimeRangeArgs) {
    const { TimeZonePicker, TimePicker } = this.ctx.selectors.components;
    try {
      await this.getByTestIdOrAriaLabel(TimePicker.openButton).click();
    } catch (e) {
      // seems like in older versions of Grafana the time picker markup is rendered twice
      await this.ctx.page.locator('[aria-controls="TimePickerContent"]').last().click();
    }

    if (zone) {
      const changeTimeSettingsButton = semver.gte(this.ctx.grafanaVersion, '11.0.0')
        ? this.getByTestIdOrAriaLabel(TimeZonePicker.changeTimeSettingsButton)
        : this.ctx.page.getByRole('button', { name: 'Change time settings' });

      await changeTimeSettingsButton.click();
      await this.getByTestIdOrAriaLabel(TimeZonePicker.containerV2).fill(zone);
    }
    await this.getByTestIdOrAriaLabel(TimePicker.absoluteTimeRangeTitle).click();
    const fromField = await this.getByTestIdOrAriaLabel(TimePicker.fromField);
    await fromField.clear();
    await fromField.fill(from);
    const toField = await this.getByTestIdOrAriaLabel(TimePicker.toField);
    await toField.clear();
    await toField.fill(to);
    await this.getByTestIdOrAriaLabel(TimePicker.applyTimeRange).click();
  }
}
