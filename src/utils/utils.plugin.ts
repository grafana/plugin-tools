import path from 'path';
import fs from 'fs';
import semver from 'semver';
import { readJsonFile } from './utils.files';
import { renderTemplateFromFile } from './utils.templates';
import { printMarkdown } from './utils.cli';
import { TEMPLATE_PATHS } from '../constants';

export function getPluginJson(srcDir?: string) {
  const srcPath = srcDir || path.join(process.cwd(), 'src');
  const pluginJsonPath = path.join(srcPath, 'plugin.json');

  return readJsonFile(pluginJsonPath);
}

export function getPackageJson() {
  return readJsonFile(path.join(process.cwd(), 'package.json'));
}

export function renderPackageJsonTemplate() {
  return JSON.parse(renderTemplateFromFile(path.join(TEMPLATE_PATHS.common, 'package.json')));
}

/**
 *
 * @param options
 * @returns An array of strings, where each item represents a summary of a package version change. (Can be used for logging.)
 */
export function updatePackageJson(options: { onlyOutdated?: Boolean; logging?: Boolean }) {
  const packageJson = getPackageJson();
  const newPackageJson = JSON.parse(renderTemplateFromFile(path.join(TEMPLATE_PATHS.common, 'package.json')));

  // Dependencies
  packageJson.dependencies = updateDependencies(packageJson.dependencies, newPackageJson.dependencies, options);

  // Dev dependencies
  packageJson.devDependencies = updateDependencies(
    packageJson.devDependencies,
    newPackageJson.devDependencies,
    options
  );

  fs.writeFileSync(path.join(process.cwd(), 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
}

/**
 * Updates the `dependencies` or `devDependencies` object of a package.json.
 *
 * @param currentDeps - The `dependencies` / `devDependencies` object that comes from the current package.json of the project.
 * @param newDeps - The `dependencies` / `devDependencies` object that comes from the new rendered package.json
 * @param options
 * @returns An array of strings, where each item represents a summary of a package version change. (Can be used for logging.)
 */
export function updateDependencies(
  currentDeps: Record<string, string>,
  newDeps: Record<string, string>,
  options: { onlyOutdated?: Boolean; logging?: Boolean } = {}
): Record<string, string> {
  const { onlyOutdated = false, logging = false } = options;
  const updatedDeps: Record<string, string> = { ...currentDeps };
  const logs = [];

  // Dependencies
  for (const [packageName, newSemverRange] of Object.entries(newDeps)) {
    const currentSemverRange = currentDeps[packageName];

    // New dependency
    if (!currentSemverRange) {
      updatedDeps[packageName] = newSemverRange;
      continue;
    }

    // No changes
    if (newSemverRange === currentSemverRange) {
      continue;
    }

    const newSemverVersion = semver.minVersion(newSemverRange);
    const currentSemverVersion = semver.minVersion(currentSemverRange);

    // Invalid semver version / range
    if (!newSemverVersion || !semver.valid(newSemverVersion)) {
      console.log(`Skipping: invalid new semver version "${newSemverRange}" for "${packageName}"`);
      continue;
    }
    if (!currentSemverVersion || !semver.valid(currentSemverVersion)) {
      console.log(`Skipping: invalid current semver version "${currentSemverRange}" for "${packageName}"`);
      continue;
    }

    // New depdency, introduced now
    if (!currentSemverRange) {
      updatedDeps[packageName] = newSemverRange;
      logs.push(`\`${packageName}\` (new) \`${newSemverRange}\``);
      continue;
    }

    // Update dependencies
    if (!onlyOutdated || semver.gte(newSemverVersion, currentSemverVersion)) {
      updatedDeps[packageName] = newSemverRange;
      logs.push(`\`${packageName}\` \`${currentSemverRange}\` -> \`${newSemverRange}\``);
      continue;
    }
  }

  if (logging) {
    printMarkdown(logs.join('\n'));
  }

  return updatedDeps;
}
