const jsdoc = require("eslint-plugin-jsdoc");
const reactHooksPlugin = require("eslint-plugin-react-hooks");
const reactPlugin = require("eslint-plugin-react");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const typescriptParser = require("@typescript-eslint/parser");
const prettierConfig = require("eslint-config-prettier");
const stylisticTs = require("@stylistic/eslint-plugin-ts");

const baseConfig = require("./base");

/**
 * @type {Array<import('eslint').Linter.Config>}
 */
module.exports = {
  name: "@grafana/eslint-config/flat",
  ...reactHooksPlugin.configs.recommended,
  ...reactPlugin.configs.flat.recommended,
  ...prettierConfig,
  settings: baseConfig.settings,
  plugins: {
    jsdoc,
    "@typescript-eslint": tsPlugin,
    "react-hooks": reactHooksPlugin,
    "@stylistic/ts": stylisticTs,
  },
  languageOptions: {
    parser: typescriptParser,
    ecmaVersion: baseConfig.ecmaVersion,
    sourceType: baseConfig.sourceType,
    parserOptions: baseConfig.parserOptions,
  },
  rules: baseConfig.rules,
};
