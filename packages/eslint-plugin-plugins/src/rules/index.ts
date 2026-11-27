import { TSESLint } from '@typescript-eslint/utils';
import { importIsCompatible } from './importIsCompatible';
import { noCrossPluginImports } from './noCrossPluginImports';

export const rules = {
  'import-is-compatible': importIsCompatible,
  'no-cross-plugin-imports': noCrossPluginImports,
} satisfies TSESLint.Linter.PluginRules;
