import { keysOf } from './utils';
import { isVersionedSelectors, isVersionedSelectorsGroup } from './guards';
import { SelectorsOf, VersionedSelector, VersionedSelectorGroup } from './types';
import { versionedAPIs } from './versioned/apis';
import semverValid from 'semver/functions/valid';
import semverGt from 'semver/functions/gt';
import semverLt from 'semver/functions/lt';
import semverEq from 'semver/functions/eq';

type E2ESelectors = {
  apis: SelectorsOf<typeof versionedAPIs>;
};

export function resolveSelectors(version: string): E2ESelectors {
  return {
    apis: toSelectors(versionedAPIs, version),
  };
}

function toSelectors<T extends VersionedSelectorGroup<T>>(group: T, version: string): SelectorsOf<T> {
  if (!semverValid(version)) {
    throw new Error(
      'The grafana version you have supplied is not valid semver so we can not detect which selectors to use for your tests.'
    );
  }

  return keysOf<T>(group).reduce((selectors, key) => {
    const value = group[key];

    if (isVersionedSelectors(value)) {
      const versionToUse = findVersionToUse(value, version);
      //@ts-ignore - not sure how to fix this
      selectors[key] = value[versionToUse];
      return selectors;
    }

    if (isVersionedSelectorsGroup(value)) {
      //@ts-ignore - not sure how to fix this
      selectors[key] = toSelectors(value);
      return selectors;
    }

    return selectors;
  }, {} as SelectorsOf<T>);
}

function findVersionToUse(selector: VersionedSelector, version: string): string {
  return Object.keys(selector).reduce((versionToUse, currentVersion) => {
    if (!versionToUse) {
      return currentVersion;
    }

    if (semverEq(versionToUse, version)) {
      return versionToUse;
    }

    if (semverGt(versionToUse, version)) {
      if (semverGt(versionToUse, currentVersion)) {
        return currentVersion;
      }
      return versionToUse;
    }

    // versionToUse < version
    if (semverLt(versionToUse, currentVersion)) {
      if (semverLt(currentVersion, version)) {
        return currentVersion;
      }
    }

    return versionToUse;
  });
}
