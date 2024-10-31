import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';

export class UnitPicker {
  constructor(private ctx: PluginTestCtx, public readonly element: Locator) {}

  async open(): Promise<void> {
    this.element.getByRole('textbox').click();
  }

  async getOption(selector: string): Promise<Locator> {
    const steps = selector.split('>').map((step) => step.trim());
    const container = this.ctx.page.locator('div[class="rc-cascader-menus"]');

    if (steps.length === 0) {
      throw new Error(`Could not find options from passed selector: ${selector}`);
    }

    const last = steps.pop();

    for (const step of steps) {
      await container.getByRole('menuitemcheckbox', { exact: true, name: step }).click();
    }

    return container.getByRole('menuitemcheckbox', { exact: true, name: last });
  }

  value(): Locator {
    return this.element.getByRole('textbox');
  }
}
