import { TSESLint } from '@typescript-eslint/utils';
import { importExists } from './importExists';

export const rules = {
  'import-exists': importExists,
} satisfies Record<string, TSESLint.RuleModule<string, unknown[]>>;
