import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';
import { Select } from './Select';
import { ColorPicker } from './ColorPicker';

export class PanelEditOptionsGroup {
  constructor(private ctx: PluginTestCtx, public readonly element: Locator, private groupLabel: string) {}

  getRadioGroup(label: string): Locator {
    return this.getByLabel(label).getByRole('radiogroup');
  }

  async getSwitch(label: string): Promise<Locator> {
    // we need to add logic to select by a switch or a checkbox role depending on grafana version.
    const id = await this.getByLabel(label).getByRole('checkbox').getAttribute('id');
    return this.getByLabel(label).locator(`label[for='${id}']`);
  }

  getTextInput(label: string): Locator {
    return this.getByLabel(label).getByRole('textbox');
  }

  getNumberInput(label: string): Locator {
    return this.getByLabel(label).getByRole('spinbutton');
  }

  getSliderInput(label: string): Locator {
    return this.getNumberInput(label);
  }

  getSelect(label: string): Select {
    return new Select(this.ctx, this.getByLabel(label));
  }

  getColorPicker(label: string): ColorPicker {
    return new ColorPicker(this.ctx, this.getByLabel(label));
  }

  private getByLabel(optionLabel: string): Locator {
    return this.element.getByLabel(`${this.groupLabel} ${optionLabel} field property editor`);
  }
}
