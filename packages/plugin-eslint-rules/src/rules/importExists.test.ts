import { RuleTester } from '@typescript-eslint/rule-tester';
import tsEslintParser from '@typescript-eslint/parser';
import { importExists } from './importExists';

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

ruleTester.run('import-exists', importExists, {
  valid: [
    {
      code: `import { LoadingPlaceholder } from '@grafana/ui';`,
      // code: `import { getBackendSrv, isFetchError } from '@grafana/runtime';`,
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
