import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';

type LocatorParams = Parameters<Locator['locator']>;

export abstract class ComponentBase {
  constructor(public readonly ctx: PluginTestCtx, protected readonly element: Locator) {}

  locator(selectorOrLocator?: LocatorParams[0], options?: LocatorParams[1]): Locator {
    if (!selectorOrLocator) {
      return this.element;
    }
    return this.element.locator(selectorOrLocator, options);
  }
}
