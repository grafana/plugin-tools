import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';
import { GrafanaPage } from '../pages/GrafanaPage';

/**
 * Base class for components that live at the page level but can optionally
 * be scoped to a sub-tree of the DOM via `within()`.
 */
export abstract class ScopedComponent extends GrafanaPage {
  constructor(
    ctx: PluginTestCtx,
    protected readonly root?: Locator
  ) {
    super(ctx);
  }

  /**
   * Returns a new instance of this component scoped to the given root locator.
   * Mirrors Playwright's `locator.locator(...)` chaining pattern.
   */
  within(root: Locator): this {
    const Ctor = this.constructor as new (ctx: PluginTestCtx, root?: Locator) => this;
    return new Ctor(this.ctx, root);
  }
}
