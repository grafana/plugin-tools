import { describe, it, expect, vi } from 'vitest';

// mock @playwright/test's expect so we can control assertion outcomes
const mockToHaveValue = vi.fn();
const mockToHaveText = vi.fn();
vi.mock('@playwright/test', () => ({
  expect: () => ({
    toHaveValue: mockToHaveValue,
    toHaveText: mockToHaveText,
  }),
}));

import { toHaveColor } from './toHaveColor';
import { ColorPicker } from '../models/components/ColorPicker';

function createMockColorPicker(hasTextbox: boolean): ColorPicker {
  const mockTextbox = {
    count: vi.fn().mockResolvedValue(hasTextbox ? 1 : 0),
  };

  const mockColorValueSpan = {};

  const mockLocator = {
    getByRole: vi.fn().mockReturnValue(mockTextbox),
    // button + span selector targets the color value span next to the swatch button
    locator: vi.fn().mockReturnValue(mockColorValueSpan),
  };

  return {
    locator: () => mockLocator,
  } as unknown as ColorPicker;
}

describe('toHaveColor', () => {
  beforeEach(() => {
    mockToHaveValue.mockReset();
    mockToHaveText.mockReset();
  });

  it('should use toHaveValue when a textbox is present (ColorPickerInput)', async () => {
    const colorPicker = createMockColorPicker(true);
    mockToHaveValue.mockResolvedValue(undefined);

    const result = await toHaveColor(colorPicker, '#ff0000');

    expect(result.pass).toBe(true);
    expect(mockToHaveValue).toHaveBeenCalledWith('#ff0000', undefined);
    expect(mockToHaveText).not.toHaveBeenCalled();
  });

  it('should use toHaveText on the color value span when no textbox is present (ColorValueEditor)', async () => {
    const colorPicker = createMockColorPicker(false);
    mockToHaveText.mockResolvedValue(undefined);

    const result = await toHaveColor(colorPicker, '#ff0000');

    expect(result.pass).toBe(true);
    expect(mockToHaveText).toHaveBeenCalledWith('#ff0000', undefined);
    expect(mockToHaveValue).not.toHaveBeenCalled();
  });

  it('should pass timeout options through to toHaveValue', async () => {
    const colorPicker = createMockColorPicker(true);
    mockToHaveValue.mockResolvedValue(undefined);

    await toHaveColor(colorPicker, 'rgb(255, 0, 0)', { timeout: 5000 });

    expect(mockToHaveValue).toHaveBeenCalledWith('rgb(255, 0, 0)', { timeout: 5000 });
  });

  it('should pass timeout options through to toHaveText', async () => {
    const colorPicker = createMockColorPicker(false);
    mockToHaveText.mockResolvedValue(undefined);

    await toHaveColor(colorPicker, 'rgb(255, 0, 0)', { timeout: 5000 });

    expect(mockToHaveText).toHaveBeenCalledWith('rgb(255, 0, 0)', { timeout: 5000 });
  });

  it('should return pass: false when textbox assertion fails', async () => {
    const colorPicker = createMockColorPicker(true);
    mockToHaveValue.mockRejectedValue(new Error('Expected "#ff0000" but got "#00ff00"'));

    const result = await toHaveColor(colorPicker, '#ff0000');

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('#ff0000');
  });

  it('should return pass: false when text content assertion fails', async () => {
    const colorPicker = createMockColorPicker(false);
    mockToHaveText.mockRejectedValue(new Error('Expected text "#ff0000" not found'));

    const result = await toHaveColor(colorPicker, '#ff0000');

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('#ff0000');
  });

  it('should target the span after the swatch button to avoid matching label text', async () => {
    const colorPicker = createMockColorPicker(false);
    mockToHaveText.mockResolvedValue(undefined);
    const mockLocator = colorPicker.locator();

    await toHaveColor(colorPicker, '#ff0000');

    // verify it targets the span sibling of the button's wrapper div,
    // not the whole field editor which would match label text
    expect(mockLocator.locator).toHaveBeenCalledWith('div:has(button) + span');
  });
});
