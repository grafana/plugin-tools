import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';

export class Select {
  constructor(private ctx: PluginTestCtx, public readonly element: Locator) {}

  getOption(label: string): Locator {
    // This one is opened in a portal so it is outside of the element
    return this.ctx.page.getByLabel('Select options menu').getByText(label);
  }

  open(): Promise<void> {
    return this.element.getByRole('combobox').click();
  }

  value(): Locator {
    return this.element.locator('div[class*="-grafana-select-value-container"]');
  }

  values(): Locator {
    return this.element.locator('div[class*="-grafana-select-multi-value-container"]');
  }
}
