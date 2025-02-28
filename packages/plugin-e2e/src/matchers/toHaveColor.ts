import { expect, MatcherReturnType } from '@playwright/test';
import { getMessage } from './utils';

import { ColorPicker } from '../models/components/ColorPicker';

export async function toHaveColor(
  colorPicker: ColorPicker,
  rgbOrHex: string,
  options?: { timeout?: number }
): Promise<MatcherReturnType> {
  try {
    await expect(colorPicker.locator().getByRole('textbox')).toHaveValue(rgbOrHex, options);

    return {
      pass: true,
      expected: rgbOrHex,
      message: () => `Value successfully selected`,
    };
  } catch (err: unknown) {
    return {
      message: () => getMessage(rgbOrHex, err instanceof Error ? err.toString() : 'Unknown error'),
      pass: false,
    };
  }
}
