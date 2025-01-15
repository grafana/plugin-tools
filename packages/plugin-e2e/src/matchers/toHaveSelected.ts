import { expect, MatcherReturnType } from '@playwright/test';
import { getMessage } from './utils';
import { ContainTextOptions } from '../types';

import { Select } from '../models/components/Select';
import { MultiSelect } from '../models/components/MultiSelect';
import { UnitPicker } from '../models/components/UnitPicker';

export async function toHaveSelected(
  target: Select | MultiSelect | UnitPicker,
  value: string | RegExp | string[] | RegExp[],
  options?: ContainTextOptions
): Promise<MatcherReturnType> {
  if (target instanceof MultiSelect) {
    if (Array.isArray(value)) {
      return expectMultiSelectToBe(target, value);
    }
    return expectMultiSelectToBe(target, [value]);
  }

  if (target instanceof Select) {
    if (Array.isArray(value)) {
      throw new Error(
        `Select only support a single value to be selected. You are asserting that multiple values have been selected: "${value}"`
      );
    }

    return expectSelectToBe(target, value, options);
  }

  if (target instanceof UnitPicker) {
    if (Array.isArray(value)) {
      throw new Error(
        `UnitPicker only support a single value to be selected. You are asserting that multiple values have been selected: "${value}"`
      );
    }
    return expectUnitPickerToBe(target, value, options);
  }

  throw Error('Unsupported parameters passed to "toBeSelected"');
}

async function expectSelectToBe(
  select: Select,
  value: string | RegExp,
  options?: ContainTextOptions
): Promise<MatcherReturnType> {
  let actual = '';

  try {
    actual = await select.locator(select.ctx.selectors.constants.Select.singleValueContainer('')).innerText(options);
    expect(actual).toMatch(value);

    return {
      pass: true,
      actual: actual,
      expected: value,
      message: () => `Value successfully selected`,
    };
  } catch (err: unknown) {
    return {
      message: () => getMessage(value.toString(), err instanceof Error ? err.toString() : 'Unknown error'),
      pass: false,
      actual,
    };
  }
}

async function expectMultiSelectToBe(select: MultiSelect, values: Array<string | RegExp>): Promise<MatcherReturnType> {
  let actual = '';

  try {
    const actual = await select.locator(select.ctx.selectors.constants.Select.multiValueContainer('')).allInnerTexts();
    expect(actual).toMatchObject(values);

    return {
      pass: true,
      actual: actual,
      expected: values,
      message: () => `Values successfully selected`,
    };
  } catch (err: unknown) {
    return {
      message: () => getMessage(values.join(', '), err instanceof Error ? err.toString() : 'Unknown error'),
      pass: false,
      actual,
      expected: values,
    };
  }
}

async function expectUnitPickerToBe(
  unitPicker: UnitPicker,
  value: string | RegExp,
  options?: ContainTextOptions
): Promise<MatcherReturnType> {
  let actual = '';

  try {
    const input = unitPicker.locator().getByRole('textbox');

    actual = await input.inputValue(options);
    await expect(input).toHaveValue(value);

    return {
      pass: true,
      actual: actual,
      expected: value,
      message: () => `Value successfully selected`,
    };
  } catch (err: unknown) {
    return {
      message: () => getMessage(value.toString(), err instanceof Error ? err.toString() : 'Unknown error'),
      pass: false,
      actual,
    };
  }
}
