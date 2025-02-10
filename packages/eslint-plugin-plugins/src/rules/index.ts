import { TSESLint } from '@typescript-eslint/utils';
import { importIsCompatible } from './importIsCompatible';

export const rules = {
  'import-is-compatible': importIsCompatible,
} satisfies TSESLint.Linter.PluginRules;
