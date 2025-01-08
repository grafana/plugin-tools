import { Locator } from '@playwright/test';
import { ComponentBase } from './ComponentBase';
import { SelectOptionsType } from './types';
import { PluginTestCtx } from '../../types';
import { gte } from 'semver';
import { resolveGrafanaSelector } from '../utils';

export class Select extends ComponentBase {
  constructor(ctx: PluginTestCtx, element: Locator) {
    super(ctx, element);
  }

  async selectOption(values: string, options?: SelectOptionsType): Promise<string> {
    const menu = await openSelect(this, options);
    return selectByValueOrLabel(values, menu, this.ctx, options);
  }
}

export async function openSelect(component: ComponentBase, options?: SelectOptionsType): Promise<Locator> {
  const element = component.locator();
  const selectors = component.ctx.selectors;
  await element.getByRole('combobox').click(options);
  return element.page().locator(resolveGrafanaSelector(selectors.components.Select.menu));
}

export async function selectByValueOrLabel(
  labelOrValue: string,
  menu: Locator,
  ctx: PluginTestCtx,
  options?: SelectOptionsType
): Promise<string> {
  const option = getOption(menu, ctx).getByText(labelOrValue, { exact: true });
  const value = await option.textContent(options);
  await option.click(options);

  if (!value) {
    throw new Error(`Could not select option: "${labelOrValue}"`);
  }

  return value;
}

function getOption(menu: Locator, ctx: PluginTestCtx): Locator {
  if (gte(ctx.grafanaVersion, '11.0.0')) {
    return menu.getByRole('option');
  }
  return menu.getByLabel('Select option');
}
