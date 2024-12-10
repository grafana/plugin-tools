import { expect, Locator, MatcherReturnType } from '@playwright/test';
import { getMessage } from './utils';

import { Switch } from '../models/components/Switch';

export async function toBeChecked(
  target: Switch | Locator,
  options?: { checked?: boolean; timeout?: number }
): Promise<MatcherReturnType> {
  const expected = options?.checked ?? true;
  try {
    if (target instanceof Switch) {
      await expect(target.locator()).toBeChecked({ ...options, checked: expected });
    } else {
      await expect(target).toBeChecked(options);
    }

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
