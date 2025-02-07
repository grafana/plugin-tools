import { ESLintUtils } from '@typescript-eslint/utils';
import { ESLint } from 'eslint';
import { rules } from './rules';

type RuleKey = keyof typeof rules;

interface Plugin extends Omit<ESLint.Plugin, 'rules'> {
  rules: Record<RuleKey, ESLintUtils.RuleModule<any, any, any>>;
}

const { name, version } = require('../package.json') as {
  name: string;
  version: string;
};

const plugin: Plugin = {
  meta: {
    name,
    version,
  },
  rules,
};

export = plugin;
