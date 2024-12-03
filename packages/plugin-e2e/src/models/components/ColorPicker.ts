import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';
import { ComponentBase } from './ComponentBase';
import { SelectOptionsType } from './types';

export type SelectableColors = 'red' | 'blue' | 'orange' | 'green' | 'yellow';

export class ColorPicker extends ComponentBase {
  constructor(private ctx: PluginTestCtx, element: Locator) {
    super(element);
  }

  async selectOption(color: SelectableColors, options?: SelectOptionsType): Promise<void> {
    await this.element.getByRole('button').click(options);
    await this.ctx.page
      .locator('#grafana-portal-container')
      .getByRole('button', { name: `${color} color`, exact: true })
      .click(options);
  }
}
