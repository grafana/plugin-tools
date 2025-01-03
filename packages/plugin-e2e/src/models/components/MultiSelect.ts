import { Locator } from '@playwright/test';
import { openSelect, selectByValueOrLabel } from './Select';
import { ComponentBase } from './ComponentBase';
import { SelectOptionsType } from './types';
import { PluginTestCtx } from '../../types';

export class MultiSelect extends ComponentBase {
  constructor(ctx: PluginTestCtx, element: Locator) {
    super(ctx, element);
  }

  async selectOptions(values: string[], options?: SelectOptionsType): Promise<string[]> {
    const menu = await openSelect(this, options);

    return Promise.all(
      values.map((value) => {
        return selectByValueOrLabel(value, menu, this.ctx, options);
      })
    );
  }
}
