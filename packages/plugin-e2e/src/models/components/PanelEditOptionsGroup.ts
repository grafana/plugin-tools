import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';

export class PanelEditOptionsGroup {
  constructor(private ctx: PluginTestCtx, private root: Locator, private groupLabel: string) {}

  getLocator(): Locator {
    return this.root;
  }

  getRadioButtonGroup(label: string): Locator {
    return this.getByLabel(label).getByRole('radiogroup');
  }

  async getSwitch(label: string): Promise<Locator> {
    // we need to add logic to select by a switch or a checkbox role depending on grafana version.
    const id = await this.getByLabel(label).getByRole('checkbox').getAttribute('id');
    return this.getByLabel(label).locator(`label[for='${id}']`);
  }

  getInput(label: string): Locator {
    return this.getByLabel(label).getByRole('textbox');
  }

  private getByLabel(optionLabel: string): Locator {
    return this.root.getByLabel(`${this.groupLabel} ${optionLabel} field property editor`);
  }
}
