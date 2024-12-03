import { expect, MatcherReturnType } from '@playwright/test';
import { getMessage } from './utils';
import { ContainTextOptions } from '../types';

import { Select } from '../models/components/Select';
import { MultiSelect } from '../models/components/MultiSelect';

export async function toHaveSelected(
  select: Select | MultiSelect,
  value: string | RegExp | string[] | RegExp[],
  options?: ContainTextOptions
): Promise<MatcherReturnType> {
  if (isMultiSelect(select)) {
    if (Array.isArray(value)) {
      return expectMultiToBe(select, value);
    }
    return expectMultiToBe(select, [value]);
  }

  if (isSingleSelect(select)) {
    if (Array.isArray(value)) {
      throw new Error(
        `Select only support a single value to be selected. You are expecting multiple values to be selected: "${value}"`
      );
    }

    return expectSingleToBe(select, value, options);
  }

  throw Error('Unsupported parameters passed to "toBeSelected"');
}

function isMultiSelect(select: Select | MultiSelect): select is MultiSelect {
  return 'selectOptions' in select;
}

function isSingleSelect(select: Select | MultiSelect): select is Select {
  return 'selectOption' in select;
}

async function expectSingleToBe(
  select: Select,
  value: string | RegExp,
  options?: ContainTextOptions
): Promise<MatcherReturnType> {
  let actual = '';

  try {
    actual = await select
      .locator('div[class*="-grafana-select-value-container"]')
      .locator('div[class*="-singleValue"]')
      .innerText(options);

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

async function expectMultiToBe(select: MultiSelect, values: Array<string | RegExp>): Promise<MatcherReturnType> {
  let actual = '';

  try {
    const actual = await select
      .locator('div[class*="-grafana-select-multi-value-container"]')
      .locator('div[class*="-grafana-select-multi-value-container"] > div')
      .allInnerTexts();

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
