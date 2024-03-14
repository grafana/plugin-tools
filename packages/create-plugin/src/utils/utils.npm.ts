import semver from 'semver';
import { GRAFANA_FE_PACKAGES } from '../constants.js';
import { getPackageJson, writePackageJson, getLatestPackageJson } from './utils.packagejson.js';
import { PackageManager } from './utils.packageManager.js';

type UpdateSummary = Record<string, { prev: string | null; next: string | null }>;

type UpdateOptions = {
  onlyOutdated?: Boolean;
  ignoreGrafanaDependencies?: boolean;
};

export function getNpmDependencyUpdatesAsText(dependencyUpdates: UpdateSummary) {
  return Object.entries(dependencyUpdates)
    .filter(([_, { prev, next }]) => prev !== next)
    .map(([packageName, { prev, next }]) => {
      // New package
      if (!prev) {
        return `\`${packageName}\` - \`${next}\` (new)`;
      }

      // Updated package
      return `\`${packageName}\` - \`${prev}\` -> \`${next}\` (updated)`;
    })
    .join('\n  ');
}

export function getPackageJsonUpdatesAsText(options: UpdateOptions = {}) {
  let asText = '';
  const { dependencyUpdates, devDependencyUpdates } = getPackageJsonUpdates(options);

  const npmDependencyUpdatesText = getNpmDependencyUpdatesAsText(dependencyUpdates);
  const npmDevDependencyUpdatesText = getNpmDependencyUpdatesAsText(devDependencyUpdates);

  if (npmDependencyUpdatesText.length > 0) {
    asText += `\n\n  **Dependencies**\n  ${getNpmDependencyUpdatesAsText(dependencyUpdates)}`;
  }

  if (npmDevDependencyUpdatesText.length > 0) {
    asText += `\n\n  **Dev Dependencies**\n  ${getNpmDependencyUpdatesAsText(devDependencyUpdates)}`;
  }

  return asText;
}

export function hasNpmDependenciesToUpdate(options: UpdateOptions = {}) {
  const { dependencyUpdates, devDependencyUpdates } = getPackageJsonUpdates(options);

  return Object.keys(dependencyUpdates).length > 0 || Object.keys(devDependencyUpdates).length > 0;
}

export function updatePackageJson(options: UpdateOptions = {}) {
  const packageJson = getPackageJson();
  const { dependencyUpdates, devDependencyUpdates } = getPackageJsonUpdates(options);

  packageJson.dependencies = updateNpmDependencies(packageJson.dependencies, dependencyUpdates);
  packageJson.devDependencies = updateNpmDependencies(packageJson.devDependencies, devDependencyUpdates);
  writePackageJson(packageJson);
}

export function updateNpmDependencies(dependencies: Record<string, string>, updateSummary: UpdateSummary) {
  const updatedDependencies = { ...dependencies };

  for (const [packageName, summary] of Object.entries(updateSummary)) {
    updatedDependencies[packageName] = summary.next ?? '';
  }

  return updatedDependencies;
}

export function getPackageJsonUpdates(options: UpdateOptions = {}) {
  const packageJson = getPackageJson();
  const newPackageJson = getLatestPackageJson();
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  const newDependencies = newPackageJson.dependencies || {};
  const newDevDependencies = newPackageJson.devDependencies || {};
  let dependencyUpdates = getUpdatableNpmDependencies(dependencies, newDependencies, options);
  let devDependencyUpdates = getUpdatableNpmDependencies(devDependencies, newDevDependencies, options);

  if (options.ignoreGrafanaDependencies) {
    const prevGrafanaDependencies = Object.entries({ ...dependencies, ...devDependencies }).reduce<
      Record<string, string>
    >((acc, [key, value]) => {
      if (GRAFANA_FE_PACKAGES.includes(key)) {
        acc[key] = value;
      }
      return acc;
    }, {});

    dependencyUpdates = ignoreGrafanaDependencies(dependencyUpdates, prevGrafanaDependencies);
    devDependencyUpdates = ignoreGrafanaDependencies(devDependencyUpdates, prevGrafanaDependencies);
  }

  return {
    dependencyUpdates,
    devDependencyUpdates,
  };
}

function ignoreGrafanaDependencies(dependencyUpdates: UpdateSummary, prevGrafanaDependencies: Record<string, string>) {
  const whatever = Object.keys(prevGrafanaDependencies);
  const result = Object.entries(dependencyUpdates).reduce<UpdateSummary>((acc, [packageName, value]) => {
    if (whatever.includes(packageName)) {
      acc[packageName] = {
        prev: prevGrafanaDependencies[packageName],
        next: prevGrafanaDependencies[packageName],
      };
    } else {
      acc[packageName] = value;
    }
    return acc;
  }, {});

  return result;
}

export function getUpdatableNpmDependencies(
  prevDeps: Record<string, string>,
  nextDeps: Record<string, string>,
  options: UpdateOptions = {}
) {
  const updateSummary: UpdateSummary = {};

  // Dependencies
  for (const [packageName, newSemverRange] of Object.entries(nextDeps)) {
    const currentSemverRange = prevDeps[packageName];

    // New dependency
    if (!currentSemverRange) {
      updateSummary[packageName] = { prev: null, next: newSemverRange };
      continue;
    }

    // No changes
    if (newSemverRange === currentSemverRange) {
      continue;
    }

    // Invalid semver range (e.g. when using release channels like "latest")
    if (!semver.validRange(newSemverRange) || !semver.validRange(currentSemverRange)) {
      updateSummary[packageName] = { prev: currentSemverRange, next: newSemverRange };
      continue;
    }

    const newSemverVersion = semver.minVersion(newSemverRange);
    const currentSemverVersion = semver.minVersion(currentSemverRange);

    // Invalid semver version / range
    if (!newSemverVersion || !semver.valid(newSemverVersion)) {
      console.warn(`Skipping: invalid new semver version "${newSemverRange}" for "${packageName}"`);
      continue;
    }
    if (!currentSemverVersion || !semver.valid(currentSemverVersion)) {
      console.warn(`Skipping: invalid current semver version "${currentSemverRange}" for "${packageName}"`);
      continue;
    }

    // Update dependencies
    if (!options.onlyOutdated || semver.gte(newSemverVersion, currentSemverVersion)) {
      updateSummary[packageName] = { prev: currentSemverRange, next: newSemverRange };
      continue;
    }
  }

  return updateSummary;
}

export function getRemovableNpmDependencies(packageNames: string[]) {
  const { dependencies = {}, devDependencies = {} } = getPackageJson();

  return packageNames.filter((packageName) => dependencies[packageName] || devDependencies[packageName]);
}

export function removeNpmDependencies(packageNames: string[], { devOnly = false } = {}) {
  const packageJson = getPackageJson();

  for (const packageName of packageNames) {
    if (!devOnly) {
      delete packageJson.dependencies[packageName];
    }
    delete packageJson.devDependencies[packageName];
  }

  writePackageJson(packageJson);
}

export function updateNpmScripts() {
  const toolkitScriptRe = /grafana-toolkit plugin:.*/;

  const packageJson = getPackageJson();
  const latestPackageJson = getLatestPackageJson();

  const scripts = {
    ...packageJson.scripts,
    ...latestPackageJson.scripts,
  };

  // loop script keys and remove toolkit scripts
  for (const key of Object.keys(scripts)) {
    if (toolkitScriptRe.test(scripts[key])) {
      delete scripts[key];
    }
  }

  packageJson.scripts = scripts;

  writePackageJson(packageJson);
}

export function writePackageManagerInPackageJson({ packageManagerName, packageManagerVersion }: PackageManager) {
  const packageJson = getPackageJson();
  if (!packageJson.packageManager) {
    packageJson.packageManager = `${packageManagerName}@${packageManagerVersion}`;
    writePackageJson(packageJson);
  }
}

export function cleanUpPackageJson() {
  const packageJson = getPackageJson();
  packageJson.scripts = sortKeysAlphabetically(packageJson.scripts);
  packageJson.dependencies = sortKeysAlphabetically(packageJson.dependencies);
  packageJson.devDependencies = sortKeysAlphabetically(packageJson.devDependencies);
  writePackageJson(packageJson);
}

function sortKeysAlphabetically(obj: Record<string, string>) {
  return Object.keys(obj)
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}
