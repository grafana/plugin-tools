import { expect, MatcherReturnType } from '@playwright/test';
import { getMessage } from './utils';

import { ColorPicker, SelectableColors } from '../models/components/ColorPicker';

export async function toHaveColor(
  colorPicker: ColorPicker,
  color: SelectableColors,
  options?: { timeout?: number }
): Promise<MatcherReturnType> {
  try {
    await expect(colorPicker.locator().getByRole('textbox')).toHaveValue(color, options);

    return {
      pass: true,
      expected: color,
      message: () => `Value successfully selected`,
    };
  } catch (err: unknown) {
    return {
      message: () => getMessage(color, err instanceof Error ? err.toString() : 'Unknown error'),
      pass: false,
    };
  }
}
