import * as nodePath from 'path';
import { AppPageNavigateOptions, PluginPageArgs, PluginTestCtx } from '../../types';
import { GrafanaPage } from './GrafanaPage';

export class AppPage extends GrafanaPage {
  constructor(readonly ctx: PluginTestCtx, readonly args: PluginPageArgs) {
    super(ctx);
  }

  /**
   * Will append the `/a/${pluginId}` before the provided path and then
   * navigate to the page.
   */
  goto(options?: AppPageNavigateOptions): Promise<void> {
    const path = options?.path ?? '';
    const url = nodePath.join('/a/', this.args.pluginId, path);
    return super.navigate(url, options);
  }
}
