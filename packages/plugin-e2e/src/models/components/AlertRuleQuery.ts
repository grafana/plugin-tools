import { DataSourcePicker } from './DataSourcePicker';
import { getByGrafanaSelectorOptions, PluginTestCtx } from '../../types';
import { GrafanaPage } from '../pages/GrafanaPage';
import { Locator } from '@playwright/test';

export class AlertRuleQuery extends GrafanaPage {
  datasource: DataSourcePicker;
  constructor(readonly ctx: PluginTestCtx, public readonly locator: Locator) {
    super(ctx);
    this.datasource = new DataSourcePicker(ctx);
  }

  getByGrafanaSelector(selector: string, options: getByGrafanaSelectorOptions = {}): Locator {
    return super.getByGrafanaSelector(selector, {
      root: this.locator,
      ...options,
    });
  }
}
