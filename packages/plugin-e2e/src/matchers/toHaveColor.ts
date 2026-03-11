import { expect, MatcherReturnType } from '@playwright/test';
import { getMessage } from './utils';

import { ColorPicker } from '../models/components/ColorPicker';

export async function toHaveColor(
  colorPicker: ColorPicker,
  rgbOrHex: string,
  options?: { timeout?: number }
): Promise<MatcherReturnType> {
  try {
    // ColorPickerInput renders an inline textbox, while ColorValueEditor
    // renders a swatch button + a span with the color value (no textbox).
    const textbox = colorPicker.locator().getByRole('textbox');
    const hasTextbox = (await textbox.count()) > 0;

    if (hasTextbox) {
      await expect(textbox).toHaveValue(rgbOrHex, options);
    } else {
      await expect(colorPicker.locator()).toContainText(rgbOrHex, options);
    }

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
