// @ts-check
const grafanaConfig = require('@grafana/eslint-config/flat');
const mdxParser = require('eslint-mdx');
const mdxPlugin = require('eslint-plugin-mdx');

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
      'docusaurus/website/.docusaurus',
      'docusaurus/website/build',
    ],
  },
  // Focus the source code configs on source code so mdx codeblocks don't inherit all the eslint config
  // which would make it very difficult to write "incomplete" snippets of code in the docs.
  ...grafanaConfig.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: ['docusaurus/docs/**'],
  })),
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
  {
    ...mdxPlugin.flat,
    ...mdxPlugin.flatCodeBlocks,
    name: 'website/mdx',
    files: ['docusaurus/docs/**/*.{md,mdx}'],
    languageOptions: {
      parser: mdxParser,
      parserOptions: {
        extensions: ['.md', '.mdx'],
        markdownExtensions: ['.md', '.mdx'],
      },
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    processor: mdxPlugin.createRemarkProcessor({
      lintCodeBlocks: true,
    }),
    rules: {
      ...mdxPlugin.flat.rules,
      ...mdxPlugin.flatCodeBlocks.rules,
    },
  },
];
