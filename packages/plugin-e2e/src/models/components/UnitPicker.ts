import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';
import { SelectOptionsType } from './types';
import { ComponentBase } from './ComponentBase';

export class UnitPicker extends ComponentBase {
  constructor(ctx: PluginTestCtx, element: Locator) {
    super(ctx, element);
  }

  static getContainer(ctx: PluginTestCtx, root?: Locator): Locator {
    const base = root ?? ctx.page;
    return base.locator('div:has(> div > [data-testid="input-wrapper"] input[placeholder="Choose"])');
  }

  within(root: Locator): UnitPicker {
    return new UnitPicker(this.ctx, UnitPicker.getContainer(this.ctx, root));
  }

  async selectOption(value: string, options?: SelectOptionsType): Promise<void> {
    await this.element.getByRole('textbox').click();
    const option = await this.getOption(value, options);
    await option.click(options);
  }

  private async getOption(selector: string, options?: SelectOptionsType): Promise<Locator> {
    const steps = selector.split('>').map((step) => step.trim());
    const container = this.ctx.page.locator(this.ctx.selectors.constants.Cascader.menu(''));

    if (steps.length === 0) {
      throw new Error(`Could not find options from passed selector: ${selector}`);
    }

    const last = steps.pop();

    for (const step of steps) {
      await container.getByTitle(step, { exact: true }).click(options);
    }

    return container.getByRole('menuitemcheckbox', { exact: true, name: last });
  }
}
