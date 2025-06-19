import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { Context } from './context.js';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { debug } from '../utils/utils.cli.js';
import chalk from 'chalk';
import { MigrationMeta } from './migrations.js';
import { output } from '../utils/utils.console.js';
import { getPackageManagerSilentInstallCmd, getPackageManagerWithFallback } from '../utils/utils.packageManager.js';
import { execSync } from 'node:child_process';

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

  output.addHorizontalLine('gray');
  output.logSingleLine(`${key} (${migration.migrationScript})`);

  if (lines.length === 0) {
    output.logSingleLine('No changes were made');
  } else {
    output.log({ title: 'Changes:', withPrefix: false, body: output.bulletList(lines) });
  }
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

/**
 * Formats the files in the migration context using the version of prettier found in the local node_modules.
 * If prettier isn't installed or the file is ignored or has no parser, it will not be formatted.
 *
 * @param context - The context to format.
 */
export async function formatFiles(context: Context) {
  let prettier;
  const require = createRequire(import.meta.url);
  // import.meta.resolve parent arg doesn't change base path for bare specifiers so need to use require.resolve
  const localPrettierPath = require.resolve('prettier', { paths: [process.cwd()] });

  try {
    prettier = await import(localPrettierPath);
  } catch (error) {
    // don't do anything if prettier is not installed
  }

  if (!prettier) {
    return;
  }

  if (prettier.default) {
    prettier = prettier.default;
  }

  const files = context.listChanges();
  for (const [filePath, { content, changeType }] of Object.entries(files)) {
    if (changeType !== 'delete' && content) {
      const prettierOptions = await prettier.resolveConfig(filePath);
      const supported = await prettier.getFileInfo(filePath, prettierOptions as any);

      if (filePath.endsWith('.eslintrc')) {
        supported.inferredParser = 'json';
      }
      if (supported.ignored || !supported.inferredParser) {
        continue;
      }

      files[filePath] = {
        ...files[filePath],
        content: await prettier.format(content, {
          ...prettierOptions,
          parser: supported.inferredParser,
        }),
      };
    }
  }
}

// Cache the package.json contents to avoid re-installing dependencies if the package.json hasn't changed
let packageJsonInstallCache: string;

export function installNPMDependencies(context: Context) {
  const hasPackageJsonChanges = Object.entries(context.listChanges()).some(
    ([filePath, { changeType }]) => filePath === 'package.json' && changeType === 'update'
  );

  if (!hasPackageJsonChanges) {
    return;
  }

  const packageJsonContents = context.getFile('package.json');

  if (!packageJsonContents) {
    return;
  }

  if (packageJsonContents !== packageJsonInstallCache) {
    packageJsonInstallCache = packageJsonContents;
    output.logSingleLine('Installing NPM dependencies...');
    const packageManager = getPackageManagerWithFallback();
    const installCmd = getPackageManagerSilentInstallCmd(
      packageManager.packageManagerName,
      packageManager.packageManagerVersion
    );
    execSync(installCmd, { cwd: context.basePath, stdio: 'inherit' });
  }
}
