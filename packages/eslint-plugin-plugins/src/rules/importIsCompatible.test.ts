import { RuleTester } from '@typescript-eslint/rule-tester';
import tsEslintParser from '@typescript-eslint/parser';
import { importIsCompatible } from './importIsCompatible';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsEslintParser,
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run('import-is-compatible', importIsCompatible, {
  valid: [
    {
      code: `import { LoadingState, PluginContextType, PluginContextProvider, PluginContextProviderProps } from '@grafana/data';`,
    },
  ],
  invalid: [
    {
      code: `import { createSausage } from '@grafana/data';`,
      errors: [
        {
          messageId: 'issue:import',
        },
      ],
    },
  ],
});
