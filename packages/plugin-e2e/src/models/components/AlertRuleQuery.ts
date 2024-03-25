import { DataSourcePicker } from './DataSourcePicker';
import { GetByTestIdOrAriaLabelOptions, PluginTestCtx } from '../../types';
import { GrafanaPage } from '../pages/GrafanaPage';
import { Locator } from '@playwright/test';

export class AlertRuleQuery extends GrafanaPage {
  datasource: DataSourcePicker;
  constructor(readonly ctx: PluginTestCtx, public readonly locator: Locator) {
    super(ctx);
    this.datasource = new DataSourcePicker(ctx);
  }

  getByTestIdOrAriaLabel(selector: string, options: GetByTestIdOrAriaLabelOptions = {}): Locator {
    return super.getByTestIdOrAriaLabel(selector, {
      root: this.locator,
      ...options,
    });
  }
}
