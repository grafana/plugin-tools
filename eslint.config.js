// @ts-check
const grafanaConfig = require('@grafana/eslint-config/flat');

/**
 * @type {Array<import('eslint').Linter.Config>}
 */
module.exports = [
  {
    files: ['**/*.{ts,tsx,js}'],
    ignores: [
      '.github',
      '.yarn',
      '**/.*', // dotfiles aren't ignored by default in FlatConfig,
    ],
  },
  grafanaConfig,
  {
    rules: {
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'off',
    },
  },
];
