import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../types';
import { DataSourcePicker } from './components/DataSourcePicker';

/**
 * Factory for components that are not attached to a specific page.
 *
 * Use this when you need to interact with a Grafana UI component on a page
 * that is not covered by one of the page fixtures (e.g. {@link PanelEditPage}
 * or {@link ExplorePage}).
 */
export class Components {
  constructor(private ctx: PluginTestCtx) {}

  /**
   * Returns a {@link DataSourcePicker} instance.
   *
   * Optionally pass a root locator to scope the picker to a specific container.
   */
  getDataSourcePicker(root?: Locator): DataSourcePicker {
    return new DataSourcePicker(this.ctx, root);
  }
}
