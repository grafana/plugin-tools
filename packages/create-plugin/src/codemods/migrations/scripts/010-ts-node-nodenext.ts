import { applyEdits, modify } from 'jsonc-parser';
import type { Context } from '../../context.js';

const TSCONFIG_PATH = '.config/tsconfig.json';

const FORMATTING_OPTIONS = {
  formattingOptions: { insertSpaces: true, tabSize: 2 },
};

const UPDATES: Array<{ key: string; oldValue?: string; newValue: string }> = [
  { key: 'module', oldValue: 'commonjs', newValue: 'nodenext' },
  { key: 'moduleResolution', newValue: 'nodenext' },
  { key: 'target', oldValue: 'es5', newValue: 'es2022' },
];

export default function migrate(context: Context) {
  if (!context.doesFileExist(TSCONFIG_PATH)) {
    return context;
  }

  const original = context.getFile(TSCONFIG_PATH) || '';
  let next = original;

  for (const { key, oldValue, newValue } of UPDATES) {
    if (oldValue !== undefined) {
      const oldPattern = `"${key}": "${oldValue}"`;
      if (!next.includes(oldPattern)) {
        continue;
      }
    }
    next = applyEdits(next, modify(next, ['ts-node', 'compilerOptions', key], newValue, FORMATTING_OPTIONS));
  }

  if (next !== original) {
    context.updateFile(TSCONFIG_PATH, next);
  }

  return context;
}
