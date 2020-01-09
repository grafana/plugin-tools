'use strict';

module.exports = {
  'extends': [
    './config-js.js',
    // 'plugin:@typescript-eslint/eslint-recommended',
    // 'plugin:@typescript-eslint/recommended',
    // 'plugin:@typescript-eslint/recommended-requiring-type-checking'
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'sourceType': 'module'
  },
  'plugins': [
    '@typescript-eslint'
  ],
  'rules': {
    '@typescript-eslint/array-type': [2, { 'default': 'array-simple' }],
    '@typescript-eslint/ban-types': [
      2,
      {
        'types': {
          'Boolean': 'Use "boolean" instead.',
          'Moment': 'Use "DateTime" instead.',
          'Number': 'Use "number" instead.',
          'Object': 'Use {} instead.',
          'String': 'Use "string" instead.'
        }
      }
    ],
    '@typescript-eslint/class-name-casing': 2,
    '@typescript-eslint/consistent-type-assertions': 2,
    '@typescript-eslint/explicit-member-accessibility': [2, { 'accessibility': 'no-public' }],
    '@typescript-eslint/interface-name-prefix': [2, { 'prefixWithI': 'never' }],
    '@typescript-eslint/no-inferrable-types': 2,
    '@typescript-eslint/no-namespace': [2, { 'allowDeclarations': false }],
    '@typescript-eslint/no-unused-vars': 0,
    '@typescript-eslint/no-use-before-define': 0,
    '@typescript-eslint/semi': 2,
    '@typescript-eslint/triple-slash-reference': 2,
    '@typescript-eslint/type-annotation-spacing': [
      2,
      {
        'after': true,
        'before': false,
        'overrides': {
          'arrow': { 'after': true, 'before': true }
        }
      }
    ]
  }
};
