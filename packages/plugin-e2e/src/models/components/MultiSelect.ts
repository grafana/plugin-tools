import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';
import { openSelect, selectByValueOrLabel } from './Select';
import { ComponentBase } from './ComponentBase';

type OptionsType = Parameters<Locator['selectOption']>[1];

export class MultiSelect extends ComponentBase {
  constructor(private ctx: PluginTestCtx, element: Locator) {
    super(element);
  }

  async selectOptions(values: string[], options?: OptionsType): Promise<string[]> {
    const menu = await openSelect(this.element, options);

    return Promise.all(
      values.map((value) => {
        return selectByValueOrLabel(value, menu, options);
      })
    );
  }
}
