import { Locator } from '@playwright/test';
import { ComponentBase } from './ComponentBase';
import { CheckOptionsType } from './types';

export class RadioGroup extends ComponentBase {
  constructor(element: Locator) {
    super(element);
  }

  async check(labelOrValue: string, options?: CheckOptionsType): Promise<void> {
    return this.element.getByLabel(labelOrValue, { exact: true }).check(options);
  }
}
