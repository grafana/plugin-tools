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
    return JSON.parse(context.getFile(path) || '');
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
      if (isVersionGreater(newVersion, currentDeps[dep])) {
        currentDeps[dep] = newVersion;
      } else {
        migrationsDebug('would downgrade dependency %s to %s', dep, newVersion);
      }
    } else if (currentDevDeps[dep]) {
      if (isVersionGreater(newVersion, currentDevDeps[dep])) {
        currentDevDeps[dep] = newVersion;
      } else {
        migrationsDebug('would downgrade devDependency %s to %s', dep, newVersion);
      }
    } else {
      // Not present, add to dependencies
      currentDeps[dep] = newVersion;
    }
  }

  // Handle devDependencies
  for (const [dep, newVersion] of Object.entries(devDependencies)) {
    if (currentDeps[dep]) {
      if (isVersionGreater(newVersion, currentDeps[dep])) {
        currentDeps[dep] = newVersion;
      } else {
        migrationsDebug('would downgrade dependency %s to %s', dep, newVersion);
      }
    } else if (currentDevDeps[dep]) {
      if (isVersionGreater(newVersion, currentDevDeps[dep])) {
        currentDevDeps[dep] = newVersion;
      } else {
        migrationsDebug('would downgrade devDependency %s to %s', dep, newVersion);
      }
    } else {
      // Not present, add to devDependencies
      currentDevDeps[dep] = newVersion;
    }
  }

  // Only update if there are actual changes
  const hasChanges =
    JSON.stringify(currentDeps) !== JSON.stringify(currentPackageJson.dependencies || {}) ||
    JSON.stringify(currentDevDeps) !== JSON.stringify(currentPackageJson.devDependencies || {});

  if (!hasChanges) {
    return;
  }

  // Sort dependencies alphabetically for consistency
  const sortedDeps = sortObjectByKeys(currentDeps);
  const sortedDevDeps = sortObjectByKeys(currentDevDeps);

  const updatedPackageJson = {
    ...currentPackageJson,
    ...(Object.keys(sortedDeps).length > 0 && { dependencies: sortedDeps }),
    ...(Object.keys(sortedDevDeps).length > 0 && { devDependencies: sortedDevDeps }),
  };

  migrationsDebug('updated package.json', updatedPackageJson);

  context.updateFile(packageJsonPath, JSON.stringify(updatedPackageJson, null, 2));
}

export function removeDependenciesFromPackageJson(
  context: Context,
  dependencies: string[],
  devDependencies: string[] = [],
  packageJsonPath = 'package.json'
) {
  const currentPackageJson = readJsonFile(context, packageJsonPath);

  let hasChanges = false;

  for (const dep of dependencies) {
    if (currentPackageJson.dependencies?.[dep]) {
      delete currentPackageJson.dependencies[dep];
      migrationsDebug('removed dependency %s', dep);
      hasChanges = true;
    }
  }

  for (const dep of devDependencies) {
    if (currentPackageJson.devDependencies?.[dep]) {
      delete currentPackageJson.devDependencies[dep];
      migrationsDebug('removed devDependency %s', dep);
      hasChanges = true;
    }
  }

  if (!hasChanges) {
    return;
  }

  migrationsDebug('updated package.json', currentPackageJson);

  context.updateFile(packageJsonPath, JSON.stringify(currentPackageJson, null, 2));
}

// Handle special version strings like "latest", "next", etc.
const DIST_TAGS = {
  '*': 2,
  next: 1,
  latest: 0,
};

/**
 * Compares two version strings to determine if the incoming version is greater
 */
export function isVersionGreater(incomingVersion: string, existingVersion: string): boolean {
  const incomingIsDistTag = incomingVersion in DIST_TAGS;
  const existingIsDistTag = existingVersion in DIST_TAGS;

  if (incomingIsDistTag && existingIsDistTag) {
    return DIST_TAGS[incomingVersion as keyof typeof DIST_TAGS] > DIST_TAGS[existingVersion as keyof typeof DIST_TAGS];
  }

  // We can't determine the exact version the dist tag pointed to so we force an update so the migration changes and expected
  // dependency version are aligned. This should mean the codebase is more likely to continue working post-migration, even if
  // it potentially downgrades from a newer version to the specific version the migration expects.
  if (incomingIsDistTag || existingIsDistTag) {
    return true;
  }

  // Both are semver versions, use standard semver comparison
  const incomingSemver = cleanSemver(incomingVersion);
  const existingSemver = cleanSemver(existingVersion);

  // If either version can't be parsed as semver, default to treating the incoming version as greater.
  if (!incomingSemver || !existingSemver) {
    return true;
  }

  return gt(incomingSemver, existingSemver);
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
