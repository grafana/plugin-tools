import { PluginPageArgs, NavigateOptions, PluginTestCtx } from '../../types';
import { GrafanaPage } from './GrafanaPage';

export class PluginConfigPage extends GrafanaPage {
  constructor(readonly ctx: PluginTestCtx, readonly args: PluginPageArgs) {
    super(ctx, args);
  }

  /**
   * Navigates to the app plugin config page.
   */
  goto(options?: NavigateOptions): Promise<void> {
    const url = this.ctx.selectors.pages.Plugin.url(this.args.pluginId);
    return super.navigate(url, options);
  }
}
