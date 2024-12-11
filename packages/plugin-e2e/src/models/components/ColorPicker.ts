import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';
import { ComponentBase } from './ComponentBase';
import { SelectOptionsType } from './types';
import { gte } from 'semver';

export class ColorPicker extends ComponentBase {
  constructor(ctx: PluginTestCtx, element: Locator) {
    super(ctx, element);
  }

  async selectOption(rgbOrHex: string, options?: SelectOptionsType): Promise<void> {
    await this.element.getByRole('button').click(options);
    await this.getContainer().getByRole('button', { name: 'Custom', exact: true }).click(options);

    const colorInput = this.getContainer().getByTestId('input-wrapper').getByRole('textbox');
    await colorInput.hover(options);
    await colorInput.fill(rgbOrHex, options);
  }

  private getContainer(): Locator {
    if (gte(this.ctx.grafanaVersion, '8.7.0')) {
      return this.ctx.page.locator('#grafana-portal-container');
    }
    return this.ctx.page.locator('body > div').last();
  }
}
