import { expect, MatcherReturnType } from '@playwright/test';
import { getMessage } from './utils';

import { RadioGroup } from '../models/components/RadioGroup';

export async function toHaveChecked(
  radioGroup: RadioGroup,
  expected: string,
  options?: { timeout?: number }
): Promise<MatcherReturnType> {
  try {
    await expect(radioGroup.locator().getByLabel(expected)).toBeChecked(options);

    return {
      pass: true,
      expected,
      message: () => `Value successfully selected`,
    };
  } catch (err: unknown) {
    return {
      message: () => getMessage(expected.toString(), err instanceof Error ? err.toString() : 'Unknown error'),
      pass: false,
    };
  }
}
