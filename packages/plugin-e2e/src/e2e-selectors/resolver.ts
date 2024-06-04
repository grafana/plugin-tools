import semver from 'semver';
import { E2ESelectors, SelectorsOf } from './types';
import {
  SelectorResolver,
  SelectorResolverWithArgs,
  VersionedSelector,
  VersionedSelectorGroup,
  VersionedSelectorWithArgs,
  VersionedSelectors,
} from './versioned/types';

const processSelectors = (
  selectors: E2ESelectors,
  versionedSelectors: VersionedSelectors,
  grafanaVersion: string
): E2ESelectors => {
  const keys = Object.keys(versionedSelectors);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    // @ts-ignore
    const value = versionedSelectors[key];

    if (typeof value === 'object' && Object.keys(value).length > 0 && !semver.valid(Object.keys(value)[0])) {
      // @ts-ignore
      selectors[key] = processSelectors({}, value, grafanaVersion);
    } else {
      if (typeof value === 'object' && Object.keys(value).length > 0 && semver.valid(Object.keys(value)[0])) {
        // @ts-ignore
        const sorted = Object.keys(value).sort(semver.rcompare);
        let validVersion = sorted[0];
        for (let index = 0; index < sorted.length; index++) {
          const version = sorted[index];
          if (semver.gte(grafanaVersion, version)) {
            validVersion = version;
            break;
          }
        }
        // @ts-ignore
        selectors[key] = value[validVersion];
      } else {
        // @ts-ignore
        selectors[key] = value;
      }
    }

    continue;
  }

  return selectors;
};

/**
 * Resolves selectors based on the Grafana version
 *
 * If the selector has multiple versions, the last version that is less
 * than or equal to the Grafana version will be returned.
 * If the selector doesn't have a version, it will be returned as is.
 */
export const resolveSelectors = (versionedSelectors: VersionedSelectors, grafanaVersion: string): E2ESelectors => {
  const selectors: E2ESelectors = {} as E2ESelectors;
  return processSelectors(selectors, versionedSelectors, grafanaVersion.replace(/\-.*/, ''));
};

function resolveSelectors2(versionedSelectors: VersionedSelectors, grafanaVersion: string): E2ESelectors {
  const version = grafanaVersion.replace(/\-.*/, '');

  return {
    apis: resolveSelectorGroup(versionedSelectors.apis, version),
    pages: resolveSelectorGroup(versionedSelectors.pages, version),
    components: resolveSelectorGroup(versionedSelectors.components, version),
  };
}

function resolveSelectorGroup<T>(group: VersionedSelectorGroup, grafanaVersion: string): SelectorsOf<T> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(group)) {
    if (isVersionedSelector(value)) {
      result[key] = resolveSelector(value, grafanaVersion);
    }

    if (isVersionedSelectorWithArgs(value)) {
      result[key] = resolveSelectorWithArgs(value, grafanaVersion);
    }

    if (isVersionedSelectorGroup(value)) {
      result[key] = resolveSelectorGroup(value, grafanaVersion);
    }
  }

  return result as SelectorsOf<T>;
}

function isVersionedSelector(
  target: VersionedSelectorGroup | VersionedSelector | VersionedSelectorWithArgs<any>
): target is VersionedSelector {
  if (typeof target === 'object') {
    const [first] = Object.keys(target);
    const value = target[first];

    if (typeof value === 'function') {
      return value.length === 0;
    }
  }

  return false;
}

function isVersionedSelectorWithArgs(
  target: VersionedSelectorGroup | VersionedSelector | VersionedSelectorWithArgs<any>
): target is VersionedSelectorWithArgs<any> {
  if (typeof target === 'object') {
    const [first] = Object.keys(target);
    const value = target[first];

    if (typeof value === 'function') {
      return value.length === 1;
    }
  }

  return false;
}

function isVersionedSelectorGroup(
  target: VersionedSelectorGroup | VersionedSelector | VersionedSelectorWithArgs<any>
): target is VersionedSelectorGroup {
  return !isVersionedSelectorWithArgs(target) && !isVersionedSelector(target);
}

function resolveSelectorWithArgs<T extends object>(
  versionedSelectorWithArgs: VersionedSelectorWithArgs<T>,
  grafanaVersion: string
): SelectorResolverWithArgs<T> | undefined {
  let [versionToUse, ...versions] = Object.keys(versionedSelectorWithArgs).sort(semver.rcompare);

  for (const version of versions) {
    if (semver.gte(grafanaVersion, version)) {
      versionToUse = version;
    }
  }

  return versionedSelectorWithArgs[versionToUse];
}

function resolveSelector(versionedSelector: VersionedSelector, grafanaVersion: string): SelectorResolver {
  let [versionToUse, ...versions] = Object.keys(versionedSelector).sort(semver.rcompare);

  for (const version of versions) {
    if (semver.gte(grafanaVersion, version)) {
      versionToUse = version;
    }
  }

  return versionedSelector[versionToUse];
}
