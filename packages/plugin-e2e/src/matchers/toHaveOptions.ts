import { expect, MatcherReturnType } from '@playwright/test';
import { getMessage } from './utils';

import { MultiSelect } from '../models/components/MultiSelect';

export async function toHaveOptions(select: MultiSelect, values: Array<string | RegExp>): Promise<MatcherReturnType> {
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
