import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';
import { ComponentBase } from './ComponentBase';

type OptionsType = Parameters<Locator['selectOption']>[1];

export class Select extends ComponentBase {
  constructor(private ctx: PluginTestCtx, element: Locator) {
    super(element);
  }

  async selectOption(values: string, options?: OptionsType): Promise<string> {
    const menu = await openSelect(this.element, options);
    return selectByValueOrLabel(values, menu, options);
  }
}

export async function openSelect(select: Locator, options?: OptionsType): Promise<Locator> {
  await select.getByRole('combobox').click(options);
  return select.page().getByLabel('Select options menu', {
    exact: true,
  });
}

export async function selectByValueOrLabel(
  labelOrValue: string,
  menu: Locator,
  options?: OptionsType
): Promise<string> {
  if (!labelOrValue) {
    throw new Error(`Could not select option: "${labelOrValue}"`);
  }

  const option = menu.getByRole('option', { name: labelOrValue, exact: true });
  await option.click(options);
  const value = await option.locator('span').textContent(options);

  if (!value) {
    throw new Error(`Could not select option: "${labelOrValue}"`);
  }

  return value;
}
