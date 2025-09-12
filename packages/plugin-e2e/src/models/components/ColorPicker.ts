import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';
import { ComponentBase } from './ComponentBase';
import { SelectOptionsType } from './types';
import { gte } from 'semver';
import { resolveGrafanaSelector } from '../utils';

export class ColorPicker extends ComponentBase {
  constructor(ctx: PluginTestCtx, element: Locator) {
    super(ctx, element);
  }

  async selectOption(rgbOrHex: string, options?: SelectOptionsType): Promise<void> {
    await this.element.getByRole('button').click(options);
    await this.getCustomTab().click(options);

    const colorInput = this.getContainer().getByTestId('input-wrapper').getByRole('textbox');
    await colorInput.hover(options);
    await colorInput.fill(rgbOrHex, options);
  }

  private getCustomTab(): Locator {
    if (gte(this.ctx.grafanaVersion, '11.6.0')) {
      return this.getContainer().getByRole('tab', { name: 'Custom', exact: true });
    }
    return this.getContainer().getByRole('button', { name: 'Custom', exact: true });
  }

  private getContainer(): Locator {
    const { grafanaVersion, page, selectors } = this.ctx;
    if (gte(grafanaVersion, '11.5.0')) {
      return page.locator(resolveGrafanaSelector(selectors.components.Portal.container));
    }
    if (gte(grafanaVersion, '8.7.0')) {
      return page.locator('#grafana-portal-container');
    }
    return page.locator('body > div').last();
  }
}
