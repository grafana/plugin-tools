import { Response as PlaywrightResponse } from '@playwright/test';
import { PluginPageArgs, PluginTestCtx } from '../../types';
import { PluginConfigPage } from './PluginConfigPage';

export class AppConfigPage extends PluginConfigPage {
  constructor(readonly ctx: PluginTestCtx, readonly args: PluginPageArgs) {
    super(ctx, args);
  }

  /**
   * Will wait for the settings endpoint to be called e.g. when saving settings
   */
  waitForSettingsResponse(options?: { timeout?: number }): Promise<PlaywrightResponse> {
    const url = this.ctx.selectors.apis.Plugin.settings(this.args.pluginId);
    return this.ctx.page.waitForResponse(url, options);
  }
}
