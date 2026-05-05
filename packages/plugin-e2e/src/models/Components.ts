import { PluginTestCtx } from '../types';
import { DataSourcePicker } from './components/DataSourcePicker';
import { TimeRange } from './components/TimeRange';

/**
 * Factory for components that are not attached to a specific page.
 *
 * Use this when you need to interact with a Grafana UI component on a page
 * that is not covered by one of the page fixtures (e.g. {@link PanelEditPage}
 * or {@link ExplorePage}).
 *
 * To scope a component to a sub-tree of the DOM, use `within(root)`:
 *
 * @example
 * ```typescript
 * await components.dataSourcePicker.set('prom');
 * await components.dataSourcePicker.within(panel).set('prom');
 * ```
 */
export class Components {
  readonly dataSourcePicker: DataSourcePicker;
  readonly timeRangePicker: TimeRange;

  constructor(ctx: PluginTestCtx) {
    this.dataSourcePicker = new DataSourcePicker(ctx);
    this.timeRangePicker = new TimeRange(ctx);
  }
}
