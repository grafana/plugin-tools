const STATUS_PALETTES = ['primary', 'secondary', 'info', 'error', 'success', 'warning'];
const STATUS_KEYS = ['main', 'text', 'border', 'shade', 'transparent', 'contrastText', 'name'];
const BRAND_PALETTES = ['accent', 'tertiary'];
const BRAND_KEYS = ['main', 'text', 'border', 'shade', 'transparent', 'contrastText'];

const COLOR_GROUPS = [
  ...STATUS_PALETTES.map((palette) => ({ group: palette, keys: STATUS_KEYS })),
  ...BRAND_PALETTES.map((palette) => ({ group: palette, keys: BRAND_KEYS })),
  { group: 'text', keys: ['primary', 'secondary', 'disabled', 'link', 'maxContrast'] },
  { group: 'border', keys: ['weak', 'medium', 'strong'] },
  { group: 'background', keys: ['canvas', 'primary', 'secondary'] },
  {
    group: 'action',
    keys: ['hover', 'selected', 'focus', 'hoverOpacity', 'disabledText', 'disabledBackground', 'disabledOpacity'],
  },
  { group: 'gradients', keys: ['brandHorizontal', 'brandVertical'] },
];

const COLOR_SCALARS = ['contrastThreshold', 'hoverFactor', 'tonalOffset'];

// Sizes, weights, and line heights are pinned to the values the site shipped with.
// The visual refresh changes them, and applying them would shift the layout of every docs page.
const PINNED_TYPOGRAPHY = {
  spacing: '8',
  htmlFontSize: '14',
  fontSize: '14',
  fontWeightLight: '300',
  fontWeightRegular: '400',
  fontWeightMedium: '500',
  fontWeightBold: '500',
  'size-base': '14px',
  'size-xs': '10px',
  'size-sm': '12px',
  'size-md': '14px',
  'size-lg': '18px',
};

const PINNED_VARIANTS = {
  h1: { fontWeight: '400', fontSize: '2rem', lineHeight: '1.1428571428571428', letterSpacing: '-0.00893em' },
  h2: { fontWeight: '400', fontSize: '1.7142857142857142rem', lineHeight: '1.1666666666666667', letterSpacing: '0em' },
  h3: { fontWeight: '400', fontSize: '1.5714285714285714rem', lineHeight: '1.0909090909090908', letterSpacing: '0em' },
  h4: {
    fontWeight: '400',
    fontSize: '1.2857142857142858rem',
    lineHeight: '1.2222222222222223',
    letterSpacing: '0.01389em',
  },
  h5: { fontWeight: '400', fontSize: '1.1428571428571428rem', lineHeight: '1.375', letterSpacing: '0em' },
  h6: { fontWeight: '500', fontSize: '1rem', lineHeight: '1.5714285714285714', letterSpacing: '0.01071em' },
  body: { fontWeight: '400', fontSize: '1rem', lineHeight: '1.5714285714285714', letterSpacing: '0.01071em' },
  bodySmall: { fontWeight: '400', fontSize: '0.8571428571428571rem', lineHeight: '1.5', letterSpacing: '0.0125em' },
};

const RADIUS_KEYS = ['sm', 'md', 'lg'];
const SHADOW_KEYS = ['z1', 'z2', 'z3'];

function readPath(theme, path) {
  const value = path.split('.').reduce((current, segment) => current?.[segment], theme);
  if (value === undefined || value === null) {
    throw new Error(`Missing theme token: ${path}`);
  }
  return String(value);
}

/**
 * Flattens a Grafana theme into the CSS custom property names used by theme.css.
 * Returns a map of property name (without the leading `--`) to value.
 */
export function flattenTheme(theme) {
  const tokens = {};

  const fontFamily = readPath(theme, 'typography.fontFamily');
  const fontFamilyMonospace = readPath(theme, 'typography.fontFamilyMonospace');

  tokens['spacing'] = PINNED_TYPOGRAPHY['spacing'];
  tokens['htmlFontSize'] = PINNED_TYPOGRAPHY['htmlFontSize'];
  tokens['fontFamily'] = fontFamily;
  tokens['fontFamilyMonospace'] = fontFamilyMonospace;
  for (const name of ['fontSize', 'fontWeightLight', 'fontWeightRegular', 'fontWeightMedium', 'fontWeightBold']) {
    tokens[name] = PINNED_TYPOGRAPHY[name];
  }
  for (const name of ['size-base', 'size-xs', 'size-sm', 'size-md', 'size-lg']) {
    tokens[name] = PINNED_TYPOGRAPHY[name];
  }
  for (const [variant, values] of Object.entries(PINNED_VARIANTS)) {
    tokens[`${variant}-fontFamily`] = fontFamily;
    for (const [property, value] of Object.entries(values)) {
      tokens[`${variant}-${property}`] = value;
    }
  }

  tokens['mode'] = readPath(theme, 'colors.mode');
  for (const { group, keys } of COLOR_GROUPS) {
    for (const key of keys) {
      tokens[`${group}-${key}`] = readPath(theme, `colors.${group}.${key}`);
    }
  }
  for (const name of COLOR_SCALARS) {
    tokens[name] = readPath(theme, `colors.${name}`);
  }

  for (const key of RADIUS_KEYS) {
    tokens[`radius-${key}`] = readPath(theme, `shape.radius.${key}`);
  }
  for (const key of SHADOW_KEYS) {
    tokens[`shadows-${key}`] = readPath(theme, `shadows.${key}`);
  }

  return tokens;
}
