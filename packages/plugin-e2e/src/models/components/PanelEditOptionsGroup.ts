import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';
import { GrafanaPage } from '../pages/GrafanaPage';

export class PanelEditOptionsGroup extends GrafanaPage {
  constructor(readonly ctx: PluginTestCtx, readonly locator: Locator, readonly groupLabel: string) {
    super(ctx);
  }

  // Option 1 - we provide function to fetch corresponding components from grafana UI

  input(optionLabel: string): Locator {
    return this.getByLabel(optionLabel).getByRole('textbox');
  }

  switch(optionLabel: string): Locator {
    return this.getByLabel(optionLabel).getByRole('checkbox');
  }

  // Option 2 - we provide functions to directly take an action on an component.

  uncheck(optionLabel: string): Promise<void> {
    return this.getByLabel(optionLabel).getByRole('checkbox').uncheck();
  }

  check(optionLabel: string): Promise<void> {
    return this.getByLabel(optionLabel).getByRole('checkbox').check();
  }

  fill(optionLabel: string, value: string): Promise<void> {
    return this.getByLabel(optionLabel).getByRole('textbox').fill(value);
  }

  clear(optionLabel: string): Promise<void> {
    return this.getByLabel(optionLabel).getByRole('textbox').clear();
  }

  private getByLabel(optionLabel: string): Locator {
    return this.locator.getByLabel(`${this.groupLabel} ${optionLabel}`);
  }
}
