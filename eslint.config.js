// @ts-check
const grafanaConfig = require('@grafana/eslint-config/flat');

// If you edit this config consider running `npx -y @eslint/config-inspector@latest` first.

/**
 * @type {Array<import('eslint').Linter.Config>}
 */
module.exports = [
  {
    name: 'plugin-tools/ignores',
    ignores: [
      '.github',
      '.nx/**',
      '**/.*', // dotfiles aren't ignored by default in FlatConfig,
      'packages/**/dist/**',
      'packages/create-plugin/templates/**',
    ],
  },
  {
    name: 'plugin-tools/defaults',
    files: ['**/*.{ts,tsx,js}'],
  },
  grafanaConfig,
  {
    name: 'plugin-e2e/overrides',
    rules: {
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  {
    name: 'create-plugin/overrides',
    files: ['packages/create-plugin/src/migrations/scripts/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['fs', 'fs:promises', 'node:fs', 'node:fs/promises'],
              message: 'Use the Context passed to the migration script.',
            },
          ],
        },
      ],
    },
  },
];
