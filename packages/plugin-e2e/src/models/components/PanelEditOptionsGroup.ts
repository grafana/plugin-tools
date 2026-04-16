import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';
import { ColorPicker } from './ColorPicker';
import { UnitPicker } from './UnitPicker';
import { Select } from './Select';
import { MultiSelect } from './MultiSelect';
import { Switch } from './Switch';
import { gte } from 'semver';
import { RadioGroup } from './RadioGroup';
import { resolveGrafanaSelector } from '../utils';

export class PanelEditOptionsGroup {
  constructor(
    private ctx: PluginTestCtx,
    public readonly element: Locator,
    private groupLabel: string
  ) {}

  async isExpanded(): Promise<boolean> {
    const expanded = await this.getOptionsGroupToggle().getAttribute('aria-expanded');
    return expanded === 'true';
  }

  async collapse(): Promise<void> {
    const expanded = await this.isExpanded();
    if (!expanded) {
      return;
    }
    await this.getOptionsGroupToggle().click();
  }

  async expand(): Promise<void> {
    const expanded = await this.isExpanded();
    if (expanded) {
      return;
    }
    await this.getOptionsGroupToggle().click();
  }

  getRadioGroup(label: string): RadioGroup {
    if (gte(this.ctx.grafanaVersion, '10.2.0')) {
      return new RadioGroup(this.ctx, this.getFieldLocator(label).getByRole('radiogroup'));
    }
    return new RadioGroup(this.ctx, this.getFieldLocator(label));
  }

  getSwitch(label: string): Switch {
    return new Switch(this.ctx, this.getFieldLocator(label));
  }

  getTextInput(label: string): Locator {
    return this.getFieldLocator(label).getByRole('textbox');
  }

  getNumberInput(label: string): Locator {
    return this.getFieldLocator(label).getByRole('spinbutton');
  }

  getSliderInput(label: string): Locator {
    if (gte(this.ctx.grafanaVersion, '9.1.0')) {
      return this.getNumberInput(label);
    }
    return this.getFieldLocator(label).getByRole('textbox');
  }

  getSelect(label: string): Select {
    return new Select(this.ctx, this.getFieldLocator(label));
  }

  getMultiSelect(label: string): MultiSelect {
    return new MultiSelect(this.ctx, this.getFieldLocator(label));
  }

  getColorPicker(label: string): ColorPicker {
    return new ColorPicker(this.ctx, this.getFieldLocator(label));
  }

  getUnitPicker(label: string): UnitPicker {
    return new UnitPicker(this.ctx, this.getFieldLocator(label));
  }

  // returns the field property editor locator, handling all Grafana version variants:
  // - 13.1.0+: data-testid="data-testid ${group} ${field} field property editor"
  // - older: aria-label="${group} ${field} field property editor"
  private getFieldLocator(optionLabel: string): Locator {
    const suffix = `${this.groupLabel} ${optionLabel} field property editor`;
    if (gte(this.ctx.grafanaVersion, '13.1.0')) {
      return this.element.getByTestId(`data-testid ${suffix}`);
    }
    return this.element.getByLabel(suffix);
  }

  private getOptionsGroupToggle(): Locator {
    const selector = resolveGrafanaSelector(this.ctx.selectors.components.OptionsGroup.toggle(this.groupLabel));

    if (gte(this.ctx.grafanaVersion, '10.0.0')) {
      return this.element.locator(selector);
    }

    return this.element.locator(selector).getByRole('button');
  }
}
