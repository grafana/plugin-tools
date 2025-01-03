import { Locator } from '@playwright/test';
import { ComponentBase } from './ComponentBase';
import { CheckOptionsType } from './types';
import { PluginTestCtx } from '../../types';
import { gte } from 'semver';

export class RadioGroup extends ComponentBase {
  constructor(ctx: PluginTestCtx, element: Locator) {
    super(ctx, element);
  }

  async check(labelOrValue: string, options?: CheckOptionsType): Promise<void> {
    if (gte(this.ctx.grafanaVersion, '10.2.0')) {
      return this.element.getByLabel(labelOrValue, { exact: true }).check(options);
    }
    return this.element.getByText(labelOrValue, { exact: true }).check(options);
  }
}
