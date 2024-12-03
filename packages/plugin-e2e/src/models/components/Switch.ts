import { Locator } from '@playwright/test';
import { ComponentBase } from './ComponentBase';
import { CheckOptionsType } from './types';

export class Switch extends ComponentBase {
  constructor(element: Locator) {
    super(element);
  }

  async check(options?: CheckOptionsType): Promise<void> {
    return this.element.check(options);
  }

  async uncheck(options?: CheckOptionsType): Promise<void> {
    return this.element.uncheck(options);
  }
}
