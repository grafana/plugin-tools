import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';

export class ColorPicker {
  constructor(private ctx: PluginTestCtx, public readonly element: Locator) {}

  clear(): Promise<void> {
    return this.element.locator('svg[class*="-Icon"]').click();
  }

  async fill(color: 'red' | 'blue' | 'orange' | 'green' | 'yellow'): Promise<void> {
    await this.element.getByRole('button').click();
    await this.ctx.page
      .locator('#grafana-portal-container')
      .getByRole('button', { name: `${color} color`, exact: true })
      .click();
  }

  value(): Locator {
    return this.element.getByRole('textbox');
  }
}
