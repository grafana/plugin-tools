import { describe, expect, it } from 'vitest';
import { flattenTheme } from './theme-tokens.mjs';

function createFakeTheme({
  background = { canvas: '#canvas', primary: '#bg-primary', secondary: '#bg-secondary' },
}: { background?: Record<string, string> } = {}) {
  const statusColors = (main: string) => ({
    main,
    text: `${main}-text`,
    border: `${main}-border`,
    shade: `${main}-shade`,
    transparent: `${main}-transparent`,
    contrastText: `${main}-contrast`,
    name: 'status',
  });

  return {
    colors: {
      mode: 'dark',
      primary: statusColors('#primary'),
      secondary: statusColors('#secondary'),
      info: statusColors('#info'),
      error: statusColors('#error'),
      success: statusColors('#success'),
      warning: statusColors('#warning'),
      accent: statusColors('#accent'),
      tertiary: statusColors('#tertiary'),
      text: {
        primary: '#text-primary',
        secondary: '#text-secondary',
        disabled: '#text-disabled',
        link: '#text-link',
        maxContrast: '#fff',
      },
      border: { weak: '#border-weak', medium: '#border-medium', strong: '#border-strong' },
      background,
      action: {
        hover: '#hover',
        selected: '#selected',
        focus: '#focus',
        hoverOpacity: 0.08,
        disabledText: '#disabled-text',
        disabledBackground: '#disabled-bg',
        disabledOpacity: 0.38,
      },
      gradients: { brandHorizontal: 'linear-gradient(h)', brandVertical: 'linear-gradient(v)' },
      contrastThreshold: 3,
      hoverFactor: 0.03,
      tonalOffset: 0.15,
    },
    shape: { radius: { sm: '4px', md: '8px', lg: '12px' } },
    shadows: { z1: 'shadow-1', z2: 'shadow-2', z3: 'shadow-3' },
    typography: {
      fontFamily: "'Inter', sans-serif",
      fontFamilyMonospace: "'Roboto Mono', monospace",
      fontWeightBold: 600,
    },
  };
}

describe('flattenTheme', () => {
  it('maps colour paths to token names without the colors prefix', () => {
    const tokens = flattenTheme(createFakeTheme());

    expect(tokens['primary-main']).toBe('#primary');
    expect(tokens['text-link']).toBe('#text-link');
    expect(tokens['background-canvas']).toBe('#canvas');
    expect(tokens['border-weak']).toBe('#border-weak');
    expect(tokens['gradients-brandHorizontal']).toBe('linear-gradient(h)');
  });

  it('stringifies numeric values', () => {
    const tokens = flattenTheme(createFakeTheme());

    expect(tokens['action-hoverOpacity']).toBe('0.08');
    expect(tokens['tonalOffset']).toBe('0.15');
  });

  it('emits the mode token', () => {
    expect(flattenTheme(createFakeTheme())['mode']).toBe('dark');
  });

  it('emits the new accent, tertiary, radius and shadow tokens', () => {
    const tokens = flattenTheme(createFakeTheme());

    expect(tokens['accent-main']).toBe('#accent');
    expect(tokens['accent-text']).toBe('#accent-text');
    expect(tokens['tertiary-main']).toBe('#tertiary');
    expect(tokens['radius-sm']).toBe('4px');
    expect(tokens['radius-md']).toBe('8px');
    expect(tokens['radius-lg']).toBe('12px');
    expect(tokens['shadows-z1']).toBe('shadow-1');
    expect(tokens['shadows-z3']).toBe('shadow-3');
  });

  it('takes font families from the theme', () => {
    const tokens = flattenTheme(createFakeTheme());

    expect(tokens['fontFamily']).toBe("'Inter', sans-serif");
    expect(tokens['fontFamilyMonospace']).toBe("'Roboto Mono', monospace");
  });

  it('pins font sizes and weights to the existing site values', () => {
    const tokens = flattenTheme(createFakeTheme());

    expect(tokens['fontWeightBold']).toBe('500');
    expect(tokens['h1-fontSize']).toBe('2rem');
    expect(tokens['h1-fontWeight']).toBe('400');
    expect(tokens['body-lineHeight']).toBe('1.5714285714285714');
    expect(tokens['size-md']).toBe('14px');
    expect(tokens['spacing']).toBe('8');
  });

  it('throws naming the missing path when the theme lacks a required token', () => {
    const theme = createFakeTheme({ background: { primary: '#bg-primary', secondary: '#bg-secondary' } });

    expect(() => flattenTheme(theme)).toThrow('colors.background.canvas');
  });
});
