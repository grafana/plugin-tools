import { Locator } from '@playwright/test';
import * as semver from 'semver';
import { PluginTestCtx } from '../types';
import { GrafanaPage } from './GrafanaPage';

const ERROR_STATUS = 'error';

export class Panel extends GrafanaPage {
  constructor(readonly ctx: PluginTestCtx, readonly locator: () => Locator) {
    super(ctx);
  }

  /**
   * Returns the locator for the panel error (if any)
   */
  getErrorIcon(): Locator {
    let selector = this.ctx.selectors.components.Panels.Panel.status(ERROR_STATUS);

    // the selector (not the selector value) used to identify a panel error changed in 9.4.3
    if (semver.lte(this.ctx.grafanaVersion, '9.4.3')) {
      selector = this.ctx.selectors.components.Panels.Panel.headerCornerInfo(ERROR_STATUS);
    }

    return this.getByTestIdOrAriaLabel(selector, {
      root: this.locator(),
    });
  }
}
