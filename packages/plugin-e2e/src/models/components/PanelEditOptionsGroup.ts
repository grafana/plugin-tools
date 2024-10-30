import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';
import { Select } from './Select';

export class PanelEditOptionsGroup {
  constructor(private ctx: PluginTestCtx, public readonly locator: Locator, private groupLabel: string) {}

  getRadioGroup(label = ''): Locator {
    return this.getByLabel(label).getByRole('radiogroup');
  }

  async getSwitch(label = ''): Promise<Locator> {
    // we need to add logic to select by a switch or a checkbox role depending on grafana version.
    const id = await this.getByLabel(label).getByRole('checkbox').getAttribute('id');
    return this.getByLabel(label).locator(`label[for='${id}']`);
  }

  getInput(label = ''): Locator {
    return this.getByLabel(label).getByRole('textbox');
  }

  getSelect(label = ''): Select {
    const locator = this.getByLabel(label).getByRole('combobox');
    return new Select(this.ctx, locator);
  }

  private getByLabel(optionLabel: string): Locator {
    return this.locator.getByLabel(`${this.groupLabel} ${optionLabel} field property editor`);
  }
}
