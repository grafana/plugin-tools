import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';

export class Select {
  constructor(private ctx: PluginTestCtx, public readonly locator: Locator) {}

  getOption(label: string): Locator {
    return this.ctx.page.getByLabel('Select options menu').getByText(label);
  }

  open(): Promise<void> {
    return this.locator.click();
  }

  value(): Locator {
    return this.ctx.page.locator(this.ctx.selectors.components.Select.singleValue(''));
  }
}
