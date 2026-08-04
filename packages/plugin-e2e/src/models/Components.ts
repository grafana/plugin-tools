import { PluginTestCtx } from '../types';
import { ColorPicker } from './components/ColorPicker';
import { DataSourcePicker } from './components/DataSourcePicker';
import { MultiSelect } from './components/MultiSelect';
import { RadioGroup } from './components/RadioGroup';
import { Select } from './components/Select';
import { Switch } from './components/Switch';
import { TimeRange } from './components/TimeRange';
import { UnitPicker } from './components/UnitPicker';

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
 * await components.select.within(fieldLabel).selectOption('Europe/Stockholm');
 * await components.switch.within(fieldLabel).check();
 * ```
 */
export class Components {
  readonly dataSourcePicker: DataSourcePicker;
  readonly timeRangePicker: TimeRange;
  readonly select: Select;
  readonly multiSelect: MultiSelect;
  readonly switch: Switch;
  readonly radioGroup: RadioGroup;
  readonly unitPicker: UnitPicker;
  readonly colorPicker: ColorPicker;

  constructor(ctx: PluginTestCtx) {
    this.dataSourcePicker = new DataSourcePicker(ctx);
    this.timeRangePicker = new TimeRange(ctx);
    this.select = new Select(ctx, Select.getContainer(ctx));
    this.multiSelect = new MultiSelect(ctx, MultiSelect.getContainer(ctx));
    this.switch = new Switch(ctx, Switch.getContainer(ctx));
    this.radioGroup = new RadioGroup(ctx, RadioGroup.getContainer(ctx));
    this.unitPicker = new UnitPicker(ctx, UnitPicker.getContainer(ctx));
    this.colorPicker = new ColorPicker(ctx, ColorPicker.getContainer(ctx));
  }
}
