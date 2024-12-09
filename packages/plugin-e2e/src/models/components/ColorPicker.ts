import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';
import { ComponentBase } from './ComponentBase';
import { SelectOptionsType } from './types';
import { lte } from 'semver';

export type SelectableColors = 'red' | 'blue' | 'orange' | 'green' | 'yellow';

export class ColorPicker extends ComponentBase {
  constructor(private ctx: PluginTestCtx, element: Locator) {
    super(element);
  }

  async selectOption(color: SelectableColors, options?: SelectOptionsType): Promise<void> {
    await this.element.getByRole('button').click(options);

    if (lte(this.ctx.grafanaVersion, '8.6.0')) {
      return await this.ctx.page
        .locator('body > div')
        .last()
        .getByRole('button', { name: `${color} color`, exact: true })
        .click(options);
    }

    await this.ctx.page
      .locator('#grafana-portal-container')
      .getByRole('button', { name: `${color} color`, exact: true })
      .click(options);
  }
}
