import { describe, it, expect, vi } from 'vitest';

// mock @playwright/test's expect so we can control assertion outcomes
const mockToHaveValue = vi.fn();
const mockToContainText = vi.fn();
vi.mock('@playwright/test', () => ({
  expect: (locator: unknown) => ({
    toHaveValue: mockToHaveValue,
    toContainText: mockToContainText,
  }),
}));

import { toHaveColor } from './toHaveColor';
import { ColorPicker } from '../models/components/ColorPicker';

function createMockColorPicker(hasTextbox: boolean): ColorPicker {
  const mockTextbox = {
    count: vi.fn().mockResolvedValue(hasTextbox ? 1 : 0),
  };

  const mockLocator = {
    getByRole: vi.fn().mockReturnValue(mockTextbox),
  };

  return {
    locator: () => mockLocator,
  } as unknown as ColorPicker;
}

describe('toHaveColor', () => {
  beforeEach(() => {
    mockToHaveValue.mockReset();
    mockToContainText.mockReset();
  });

  it('should use toHaveValue when a textbox is present (ColorPickerInput)', async () => {
    const colorPicker = createMockColorPicker(true);
    mockToHaveValue.mockResolvedValue(undefined);

    const result = await toHaveColor(colorPicker, '#ff0000');

    expect(result.pass).toBe(true);
    expect(mockToHaveValue).toHaveBeenCalledWith('#ff0000', undefined);
    expect(mockToContainText).not.toHaveBeenCalled();
  });

  it('should use toContainText when no textbox is present (ColorValueEditor)', async () => {
    const colorPicker = createMockColorPicker(false);
    mockToContainText.mockResolvedValue(undefined);

    const result = await toHaveColor(colorPicker, '#ff0000');

    expect(result.pass).toBe(true);
    expect(mockToContainText).toHaveBeenCalledWith('#ff0000', undefined);
    expect(mockToHaveValue).not.toHaveBeenCalled();
  });

  it('should pass timeout options through to toHaveValue', async () => {
    const colorPicker = createMockColorPicker(true);
    mockToHaveValue.mockResolvedValue(undefined);

    await toHaveColor(colorPicker, 'rgb(255, 0, 0)', { timeout: 5000 });

    expect(mockToHaveValue).toHaveBeenCalledWith('rgb(255, 0, 0)', { timeout: 5000 });
  });

  it('should pass timeout options through to toContainText', async () => {
    const colorPicker = createMockColorPicker(false);
    mockToContainText.mockResolvedValue(undefined);

    await toHaveColor(colorPicker, 'rgb(255, 0, 0)', { timeout: 5000 });

    expect(mockToContainText).toHaveBeenCalledWith('rgb(255, 0, 0)', { timeout: 5000 });
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
    mockToContainText.mockRejectedValue(new Error('Expected text "#ff0000" not found'));

    const result = await toHaveColor(colorPicker, '#ff0000');

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('#ff0000');
  });
});
