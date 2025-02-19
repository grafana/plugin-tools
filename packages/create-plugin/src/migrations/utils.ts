import { dirname, join } from 'node:path';
import { Context } from './context.js';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { debug } from '../utils/utils.cli.js';
import chalk from 'chalk';
import { MigrationMeta } from './migrations.js';

export function printChanges(context: Context, key: string, migration: MigrationMeta) {
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

  console.log('--------------------------------');
  console.log('Running migration:', key, chalk.bold(migration.migrationScript));

  if (lines.length === 0) {
    console.log('No changes were made');
  } else {
    console.log(`${chalk.bold('Changes:')}\n  ${lines.join('\n  ')}`);
  }
  console.log('');
}

export function flushChanges(context: Context) {
  const basePath = context.basePath;
  const changes = context.listChanges();

  for (const [filePath, { changeType, content }] of Object.entries(changes)) {
    const resolvedPath = join(basePath, filePath);
    if (changeType === 'add') {
      mkdirSync(dirname(resolvedPath), { recursive: true });
      writeFileSync(resolvedPath, content!);
    } else if (changeType === 'update') {
      writeFileSync(resolvedPath, content!);
    } else if (changeType === 'delete') {
      rmSync(resolvedPath);
    }
  }
}

export const migrationsDebug = debug.extend('migrations');
