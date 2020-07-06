"use strict";

module.exports = {
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  plugins: ["jsdoc", "prettier", "@typescript-eslint", "react-hooks"],
  extends: ["plugin:react-hooks/recommended", "plugin:prettier/recommended"],
  parser: "@typescript-eslint/parser",
  rules: {
    curly: "error",
    "dot-notation": "off",
    "eol-last": "error",
    eqeqeq: ["error", "always", { null: "ignore" }],
    "guard-for-in": "off",
    "jsdoc/check-alignment": "error",
    "new-parens": "error",
    "no-array-constructor": "error",
    "no-bitwise": "off",
    "no-caller": "error",
    "no-cond-assign": "error",
    "no-console": ["error", { allow: ["error", "log", "warn"] }],
    "no-debugger": "error",
    "no-empty": "off",
    "no-eval": "error",
    "no-fallthrough": "off",
    "no-new-wrappers": "error",
    "no-redeclare": "error",
    "no-restricted-imports": ["error", "moment"],
    "no-shadow": "off",
    "no-unused-expressions": "off",
    "no-unused-labels": "error",
    "prettier/prettier": "error",
    radix: "error",
    "sort-keys": "off",
    "spaced-comment": ["off", "always"],
    "use-isnan": "error",

    "@typescript-eslint/no-unused-expressions": [
      "error",
      { allowShortCircuit: true, allowTernary: true },
    ],
    "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "interface",
        format: ["PascalCase"],
        custom: {
          regex: "^I[A-Z]",
          match: false,
        },
      },
    ],
    "@typescript-eslint/consistent-type-assertions": "error",
    "@typescript-eslint/explicit-member-accessibility": [
      "error",
      { accessibility: "no-public" },
    ],
    "@typescript-eslint/no-inferrable-types": "error",
    "@typescript-eslint/no-namespace": ["error", { allowDeclarations: false }],
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/triple-slash-reference": "error",
    "@typescript-eslint/type-annotation-spacing": [
      "error",
      {
        after: true,
        before: false,
        overrides: {
          arrow: { after: true, before: true },
        },
      },
    ],
  },
};
