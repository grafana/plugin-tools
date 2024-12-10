import { Locator } from '@playwright/test';
import { ComponentBase } from './ComponentBase';
import { SelectOptionsType } from './types';
import { PluginTestCtx } from '../../types';
import { gte } from 'semver';

export class Select extends ComponentBase {
  constructor(ctx: PluginTestCtx, element: Locator) {
    super(ctx, element);
  }

  async selectOption(values: string, options?: SelectOptionsType): Promise<string> {
    const menu = await openSelect(this.element, options);
    return selectByValueOrLabel(values, menu, this.ctx, options);
  }
}

export async function openSelect(element: Locator, options?: SelectOptionsType): Promise<Locator> {
  await element.getByRole('combobox').click(options);
  return element.page().getByLabel('Select options menu', {
    exact: true,
  });
}

export async function selectByValueOrLabel(
  labelOrValue: string,
  menu: Locator,
  ctx: PluginTestCtx,
  options?: SelectOptionsType
): Promise<string> {
  if (!labelOrValue) {
    throw new Error(`Could not select option: "${labelOrValue}"`);
  }

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
