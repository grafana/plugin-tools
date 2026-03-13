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
    // renders a swatch button + a div with the color value (no textbox).
    const textbox = colorPicker.locator().getByRole('textbox');
    const hasTextbox = (await textbox.count()) > 0;

    if (hasTextbox) {
      await expect(textbox).toHaveValue(rgbOrHex, options);
    } else {
      // ColorValueEditor wraps the button in a div, with the color value
      // in a sibling span: div.colorPicker > button + /div > span.colorText
      // use structural selector to avoid depending on Emotion class names
      const colorValue = colorPicker.locator().locator('div:has(button) + span');
      await expect(colorValue).toHaveText(rgbOrHex, options);
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
