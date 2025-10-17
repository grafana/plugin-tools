export {
  formatFiles,
  installNPMDependencies,
  flushChanges,
  addDependenciesToPackageJson,
} from '../migrations/utils.js';

import type { AdditionMeta } from './additions.js';
import { Context } from '../migrations/context.js';
import chalk from 'chalk';
// Re-export debug with additions namespace
import { debug } from '../utils/utils.cli.js';
import { output } from '../utils/utils.console.js';

export const additionsDebug = debug.extend('additions');

export function printChanges(context: Context, key: string, addition: AdditionMeta) {
  const changes = context.listChanges();
  const lines = [];

  for (const [filePath, { changeType }] of Object.entries(changes)) {
    if (changeType === 'add') {
      lines.push(`${chalk.green('ADD')} ${filePath}`);
    } else if (changeType === 'update') {
      lines.push(`${chalk.yellow('UPDATE')} ${filePath}`);
    } else if (changeType === 'delete') {
      lines.push(`${chalk.red('DELETE')} ${filePath}`);
    }
  }

  output.addHorizontalLine('gray');
  output.logSingleLine(`${key} (${addition.description})`);

  if (lines.length === 0) {
    output.logSingleLine('No changes were made');
  } else {
    output.log({ title: 'Changes:', withPrefix: false, body: output.bulletList(lines) });
  }
}
