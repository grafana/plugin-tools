import { expect, MatcherReturnType } from '@playwright/test';
import { getMessage } from './utils';
import { ContainTextOptions } from '../types';

import { Select } from '../models/components/Select';

export async function toHaveOption(
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
