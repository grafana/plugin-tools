const baseConfig = require("./base");

module.exports = {
  parserOptions: {
    ecmaVersion: baseConfig.ecmaVersion,
    sourceType: baseConfig.sourceType,
    ...baseConfig.parserOptions,
  },
  settings: baseConfig.settings,
  plugins: ["jsdoc", "@typescript-eslint", "@stylistic/ts", "react-hooks"],
  extends: [
    "plugin:react-hooks/recommended",
    "plugin:react/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  rules: baseConfig.rules,
};
