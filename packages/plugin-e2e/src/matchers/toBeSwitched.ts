import { expect, MatcherReturnType } from '@playwright/test';
import { getMessage } from './utils';

import { Switch } from '../models/components/Switch';

export async function toBeSwitched(
  target: Switch,
  options?: { on?: boolean; timeout?: number }
): Promise<MatcherReturnType> {
  const expected = options?.on ?? true;
  try {
    await expect(target.locator()).toBeChecked({ ...options, checked: expected });

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
