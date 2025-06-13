const jsdoc = require("eslint-plugin-jsdoc");
const reactHooksPlugin = require("eslint-plugin-react-hooks");
const reactPlugin = require("eslint-plugin-react");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const typescriptParser = require("@typescript-eslint/parser");
const prettierConfig = require("eslint-config-prettier");
const stylisticTs = require("@stylistic/eslint-plugin-ts");

const baseConfig = require("./base");

module.exports = [
  reactHooksPlugin.configs["recommended-latest"],
  reactPlugin.configs.flat.recommended,
  prettierConfig,
  {
    name: "@grafana/eslint-config/flat",
    settings: baseConfig.settings,
    plugins: {
      jsdoc,
      "@typescript-eslint": tsPlugin,
      "@stylistic/ts": stylisticTs,
    },
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: baseConfig.ecmaVersion,
      sourceType: baseConfig.sourceType,
      parserOptions: baseConfig.parserOptions,
    },
    rules: baseConfig.rules,
  },
];
