import { Locator } from '@playwright/test';
import { ComponentBase } from './ComponentBase';
import { CheckOptionsType } from './types';
import { PluginTestCtx } from '../../types';
import { gte, lt } from 'semver';

export class Switch extends ComponentBase {
  private group: Locator;

  constructor(ctx: PluginTestCtx, group: Locator) {
    super(ctx, Switch.getElement(ctx, group));
    this.group = group;
  }

  private static getElement(ctx: PluginTestCtx, group: Locator): Locator {
    if (gte(ctx.grafanaVersion, '11.5.0')) {
      return group.getByRole('switch');
    } else {
      return group.getByRole('checkbox');
    }
  }

  async check(options?: CheckOptionsType): Promise<void> {
    const target = await this.getSwitch(options);
    return target.check({ force: true, ...options });
  }

  async uncheck(options?: CheckOptionsType): Promise<void> {
    const target = await this.getSwitch(options);
    return target.uncheck({ force: true, ...options });
  }

  private async getSwitch(options: CheckOptionsType): Promise<Locator> {
    if (lt(this.ctx.grafanaVersion, '11.3.0')) {
      const id = await this.element.getAttribute('id', options);
      return this.group.locator(`label[for='${id}']`);
    }
    return this.element;
  }
}
