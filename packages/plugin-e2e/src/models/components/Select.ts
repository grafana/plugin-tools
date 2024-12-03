import { Locator } from '@playwright/test';
import { PluginTestCtx } from '../../types';
import { ComponentBase } from './ComponentBase';
import { SelectOptionsType } from './types';

export class Select extends ComponentBase {
  constructor(private ctx: PluginTestCtx, element: Locator) {
    super(element);
  }

  async selectOption(values: string, options?: SelectOptionsType): Promise<string> {
    const menu = await openSelect(this.element, options);
    return selectByValueOrLabel(values, menu, options);
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
  options?: SelectOptionsType
): Promise<string> {
  if (!labelOrValue) {
    throw new Error(`Could not select option: "${labelOrValue}"`);
  }

  const option = menu.getByRole('option').getByText(labelOrValue, { exact: true });
  const value = await option.textContent(options);
  await option.click(options);

  if (!value) {
    throw new Error(`Could not select option: "${labelOrValue}"`);
  }

  return value;
}
