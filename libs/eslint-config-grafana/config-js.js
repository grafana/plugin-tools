'use strict';

module.exports = {
  'env': {
    'es6': true,
  },
  'extends': [
    // 'eslint:recommended',
    'plugin:prettier/recommended',
    'prettier',
  ],
  'parserOptions': {
    'ecmaVersion': 2019,
  },
  'plugins': [
    'jsdoc',
    // 'prefer-arrow',
    'prettier',
  ],
  'rules': {
    // 'arrow-body-style': 2,
    // 'arrow-parens': [2, 'as-needed'],
    // 'camelcase': 2,
    'curly': 2,
    'dot-notation': 0,
    'eol-last': 2,
    'eqeqeq': [2, 'always', { 'null': 'ignore' }],
    'guard-for-in': 0,
    /*'id-blacklist': [
      2,
      'any',
      'Boolean',
      'boolean',
      'Number',
      'number',
      'String',
      'string',
      'Undefined',
      'undefined',
    ],*/
    'jsdoc/check-alignment': 2,
    'new-parens': 2,
    'no-array-constructor': 2,
    'no-bitwise': 0,
    'no-caller': 2,
    'no-cond-assign': 2,
    'no-console': [2, { 'allow': ['error', 'log', 'warn'] }],
    'no-debugger': 2,
    'no-empty': 0,
    'no-eval': 2,
    'no-fallthrough': 0,
    'no-new-wrappers': 2,
    'no-redeclare': 2,
    'no-restricted-imports': [2, 'moment'],
    'no-shadow': 0,
    // 'no-throw-literal': 2,
    // 'no-unused-expressions': 2, // https://github.com/typescript-eslint/typescript-eslint/pull/1175
    'no-unused-labels': 2,
    // 'no-var': 2,
    // 'prefer-arrow-callback': 2, // not needed if 'prefer-arrow' is used
    // 'prefer-arrow/prefer-arrow-functions': 2,
    // 'prefer-const': 2,
    'prettier/prettier': 2,
    'radix': 2,
    'sort-keys': 0,
    'spaced-comment': [0, 'always'],
    'use-isnan': 2
  },
};
