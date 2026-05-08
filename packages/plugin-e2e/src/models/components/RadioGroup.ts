import { Locator } from '@playwright/test';
import { ComponentBase } from './ComponentBase';
import { CheckOptionsType } from './types';
import { PluginTestCtx } from '../../types';
import { gte } from 'semver';

export class RadioGroup extends ComponentBase {
  constructor(ctx: PluginTestCtx, element: Locator) {
    super(ctx, element);
  }

  static getContainer(ctx: PluginTestCtx, root?: Locator): Locator {
    const base = root ?? ctx.page;
    if (gte(ctx.grafanaVersion, '10.0.0')) {
      return base.locator('[role="radiogroup"]');
    }
    return base.locator('div:has(> div > input[type="radio"][name^="radiogroup-"])');
  }

  within(root: Locator): RadioGroup {
    return new RadioGroup(this.ctx, RadioGroup.getContainer(this.ctx, root));
  }

  async check(labelOrValue: string, options?: CheckOptionsType): Promise<void> {
    if (gte(this.ctx.grafanaVersion, '10.2.0')) {
      return this.element.getByLabel(labelOrValue, { exact: true }).check(options);
    }
    return this.element.getByText(labelOrValue, { exact: true }).check(options);
  }
}
