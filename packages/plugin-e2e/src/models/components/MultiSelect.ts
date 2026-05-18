import { Locator } from '@playwright/test';
import { gte } from 'semver';
import { openSelect, selectByValueOrLabel } from './Select';
import { ComponentBase } from './ComponentBase';
import { SelectOptionsType } from './types';
import { PluginTestCtx } from '../../types';
import { resolveGrafanaSelector } from '../utils';

export class MultiSelect extends ComponentBase {
  constructor(ctx: PluginTestCtx, element: Locator) {
    super(ctx, element);
  }

  static getContainer(ctx: PluginTestCtx, root?: Locator): Locator {
    const base = root ?? ctx.page;
    if (gte(ctx.grafanaVersion, '13.1.0')) {
      return base.locator(resolveGrafanaSelector(ctx.selectors.components.MultiSelect.container)).first();
    }
    // The CSS class targets the value container itself, but toHaveSelected uses a
    // descendant query starting from that class, so the element must be a parent.
    return base.locator('[class*="-grafana-select-value-container-multi"]').locator('xpath=..').first();
  }

  within(root: Locator): MultiSelect {
    return new MultiSelect(this.ctx, MultiSelect.getContainer(this.ctx, root));
  }

  async selectOptions(values: string[], options?: SelectOptionsType): Promise<string[]> {
    const menu = await openSelect(this, options);

    const selected: string[] = [];
    for (const value of values) {
      selected.push(await selectByValueOrLabel(value, menu, this.ctx, options));
    }
    return selected;
  }
}
