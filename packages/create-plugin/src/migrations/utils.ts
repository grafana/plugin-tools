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
import { clean, coerce, gt } from 'semver';

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
// (This runs for each migration used in an update)
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

export function readJsonFile<T extends object = any>(context: Context, path: string): T {
  if (!context.doesFileExist(path)) {
    throw new Error(`Cannot find ${path}`);
  }
  try {
    return JSON.parse(context.getFile(path) || '{}');
  } catch (e) {
    throw new Error(`Cannot parse ${path}: ${e}`);
  }
}

export function addDependenciesToPackageJson(
  context: Context,
  dependencies: Record<string, string>,
  devDependencies: Record<string, string> = {},
  packageJsonPath = 'package.json'
) {
  const currentPackageJson = readJsonFile(context, packageJsonPath);
  const currentDeps = { ...(currentPackageJson.dependencies || {}) };
  const currentDevDeps = { ...(currentPackageJson.devDependencies || {}) };

  // Handle dependencies
  for (const [dep, newVersion] of Object.entries(dependencies)) {
    if (currentDeps[dep]) {
      if (isIncomingVersionGreater(newVersion, currentDeps[dep])) {
        currentDeps[dep] = newVersion;
      }
    } else if (currentDevDeps[dep]) {
      // Exists in devDependencies, only update there if new version is greater
      if (isIncomingVersionGreater(newVersion, currentDevDeps[dep])) {
        currentDevDeps[dep] = newVersion;
      }
    } else {
      // Not present, add to dependencies
      currentDeps[dep] = newVersion;
    }
  }

  // Handle devDependencies
  for (const [dep, newVersion] of Object.entries(devDependencies)) {
    if (currentDeps[dep]) {
      // Exists in dependencies, only update there if new version is greater
      if (isIncomingVersionGreater(newVersion, currentDeps[dep])) {
        currentDeps[dep] = newVersion;
      }
    } else if (currentDevDeps[dep]) {
      if (isIncomingVersionGreater(newVersion, currentDevDeps[dep])) {
        currentDevDeps[dep] = newVersion;
      }
    } else {
      // Not present, add to devDependencies
      currentDevDeps[dep] = newVersion;
    }
  }

  // Sort dependencies alphabetically for consistency
  const sortedDeps = sortObjectByKeys(currentDeps);
  const sortedDevDeps = sortObjectByKeys(currentDevDeps);

  // Only update if there are actual changes
  const hasChanges =
    JSON.stringify(sortedDeps) !== JSON.stringify(currentPackageJson.dependencies || {}) ||
    JSON.stringify(sortedDevDeps) !== JSON.stringify(currentPackageJson.devDependencies || {});

  if (!hasChanges) {
    return;
  }

  const updatedPackageJson = {
    ...currentPackageJson,
    dependencies: sortedDeps,
    devDependencies: sortedDevDeps,
  };

  context.updateFile(packageJsonPath, JSON.stringify(updatedPackageJson, null, 2));
}

export function removeDependenciesFromPackageJson(
  context: Context,
  dependencies: string[],
  devDependencies: string[] = [],
  packageJsonPath = 'package.json'
) {
  const currentPackageJson = readJsonFile(context, packageJsonPath);
  const currentDeps = { ...(currentPackageJson.dependencies || {}) };
  const currentDevDeps = { ...(currentPackageJson.devDependencies || {}) };

  let hasChanges = false;

  // Remove dependencies from dependencies section
  for (const dep of dependencies) {
    if (currentDeps[dep]) {
      delete currentDeps[dep];
      hasChanges = true;
    }
  }

  // Remove dependencies from devDependencies section
  for (const dep of devDependencies) {
    if (currentDevDeps[dep]) {
      delete currentDevDeps[dep];
      hasChanges = true;
    }
  }

  // Only update if there are actual changes
  if (!hasChanges) {
    return;
  }

  const updatedPackageJson = {
    ...currentPackageJson,
    dependencies: currentDeps,
    devDependencies: currentDevDeps,
  };

  context.updateFile(packageJsonPath, JSON.stringify(updatedPackageJson, null, 2));
}

const UNIDENTIFIED_VERSION = 'UNIDENTIFIED_VERSION';
// Handle special version strings like "latest", "next", etc.
const DIST_TAGS = {
  '*': 2,
  UNIDENTIFIED_VERSION: 2,
  next: 1,
  latest: 0,
};

/**
 * Compares two version strings to determine if the incoming version is greater
 */
function isIncomingVersionGreater(incomingVersion: string, existingVersion: string): boolean {
  // if version is in the format of "latest", "next" or similar - keep it, otherwise try to parse it
  const incomingVersionCompareBy =
    incomingVersion in DIST_TAGS ? incomingVersion : (cleanSemver(incomingVersion)?.toString() ?? UNIDENTIFIED_VERSION);
  const existingVersionCompareBy =
    existingVersion in DIST_TAGS ? existingVersion : (cleanSemver(existingVersion)?.toString() ?? UNIDENTIFIED_VERSION);

  if (incomingVersionCompareBy in DIST_TAGS && existingVersionCompareBy in DIST_TAGS) {
    return (
      DIST_TAGS[incomingVersionCompareBy as keyof typeof DIST_TAGS] >
      DIST_TAGS[existingVersionCompareBy as keyof typeof DIST_TAGS]
    );
  }

  if (incomingVersionCompareBy in DIST_TAGS || existingVersionCompareBy in DIST_TAGS) {
    return true;
  }

  return gt(
    cleanSemver(incomingVersion)?.toString() ?? UNIDENTIFIED_VERSION,
    cleanSemver(existingVersion)?.toString() ?? UNIDENTIFIED_VERSION
  );
}

/**
 * Cleans and coerces a semver version string
 */
function cleanSemver(version: string) {
  return clean(version) ?? coerce(version);
}

/**
 * Sorts object keys alphabetically for consistent package.json formatting
 */
function sortObjectByKeys<T extends Record<string, any>>(obj: T): T {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {} as T);
}
