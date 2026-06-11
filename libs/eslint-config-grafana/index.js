import jsdoc from "eslint-plugin-jsdoc";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactPlugin from "eslint-plugin-react";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";
import stylistic from "@stylistic/eslint-plugin";

export default [
  reactHooksPlugin.configs.flat.recommended,
  reactPlugin.configs.flat.recommended,
  prettierConfig,
  {
    name: "@grafana/eslint-config",
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      jsdoc,
      "@typescript-eslint": tsPlugin,
      "@stylistic": stylistic,
    },
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 2019,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
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
      "no-console": ["error", { allow: ["error", "log", "warn", "info"] }],
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
      "no-var": "error",
      radix: "error",
      "sort-keys": "off",
      "spaced-comment": ["off", "always"],
      "use-isnan": "error",
      "no-duplicate-imports": "error",
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
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/no-namespace": [
        "error",
        { allowDeclarations: false },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/triple-slash-reference": "error",
      "@stylistic/type-annotation-spacing": [
        "error",
        {
          after: true,
          before: false,
          overrides: {
            arrow: "ignore",
          },
        },
      ],
      "@stylistic/arrow-spacing": ["error", { after: true, before: true }],
      "react-hooks/exhaustive-deps": "error",
    },
  },
];
