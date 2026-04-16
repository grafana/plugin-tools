import { Locator } from '@playwright/test';
import { ComponentBase } from './ComponentBase';
import { SelectOptionsType } from './types';
import { PluginTestCtx } from '../../types';
import { resolveGrafanaSelector } from '../utils';

export class Select extends ComponentBase {
  constructor(ctx: PluginTestCtx, element: Locator) {
    super(ctx, element);
  }

  async selectOption(values: string, options?: SelectOptionsType): Promise<string> {
    const menu = await openSelect(this, options);
    // type into whichever input gained focus when the select opened - handles virtualized
    // lists (e.g. timezone picker in Grafana 13.1+) where options are lazily rendered
    await this.locator().page().keyboard.type(values);
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
  _ctx: PluginTestCtx,
  options?: SelectOptionsType
): Promise<string> {
  const allOptions = getOption(menu);
  let option = allOptions.getByText(labelOrValue, { exact: true });

  // fall back to first visible option when no exact match exists - handles cases where
  // the caller already filtered the list by typing and the option label doesn't match
  // the search term (e.g. timezone picker in Grafana 13.1+ shows "Stockholm CEST UTC+02:00"
  // when searching "Europe/Stockholm")
  if (!(await option.count()) && (await allOptions.count()) === 1) {
    option = allOptions.first();
  }

  const value = await option.textContent(options);
  await option.click(options);

  if (!value) {
    throw new Error(`Could not select option: "${labelOrValue}"`);
  }

  return value;
}

// Grafana 11.0+ uses role="option"; older versions use aria-label="Select option"
function getOption(menu: Locator): Locator {
  return menu.getByRole('option').or(menu.getByLabel('Select option'));
}
