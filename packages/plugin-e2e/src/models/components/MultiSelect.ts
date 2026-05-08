import { Locator } from '@playwright/test';
import { openSelect, selectByValueOrLabel } from './Select';
import { ComponentBase } from './ComponentBase';
import { SelectOptionsType } from './types';
import { PluginTestCtx } from '../../types';

export class MultiSelect extends ComponentBase {
  constructor(ctx: PluginTestCtx, element: Locator) {
    super(ctx, element);
  }

  static getContainer(ctx: PluginTestCtx, root?: Locator): Locator {
    const base = root ?? ctx.page;
    return base.locator('[class*="-grafana-select-value-container-multi"]');
  }

  within(root: Locator): MultiSelect {
    return new MultiSelect(this.ctx, MultiSelect.getContainer(this.ctx, root));
  }

  async selectOptions(values: string[], options?: SelectOptionsType): Promise<string[]> {
    const menu = await openSelect(this, options);

    const selected: string[] = [];
    for (const value of values) {
      selected.push(await selectByValueOrLabel(value, menu, this.ctx, options));
    }
    return selected;
  }
}
