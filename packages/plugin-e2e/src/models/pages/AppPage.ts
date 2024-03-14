import * as nodePath from 'path';
import { NavigateOptions, PluginPageArgs, PluginTestCtx } from '../../types';
import { GrafanaPage } from '..';

export class AppPage extends GrafanaPage {
  constructor(readonly ctx: PluginTestCtx, readonly args: PluginPageArgs) {
    super(ctx);
  }

  /**
   * Will append the `/a/${pluginId}` before the provided path and then
   * navigate to the page.
   */
  goto(path?: string, options?: NavigateOptions): Promise<void> {
    const url = nodePath.join('/a/', this.args.pluginId, path ?? '');
    return super.navigate(url, options);
  }
}
