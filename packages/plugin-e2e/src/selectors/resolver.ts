import * as semver from 'semver';
import { versionedAPIs } from './versionedAPIs';
import {
  CustomSelectorGroup,
  FunctionSelector,
  SelectorsOf,
  StringSelector,
  VersionedFunctionSelector,
  VersionedSelectorGroup,
  VersionedStringSelector,
} from './types';
import { versionedConstants } from './versionedConstants';

export function resolveCustomSelectors(grafanaVersion: string): CustomSelectorGroup {
  const version = grafanaVersion.replace(/\-.*/, '');

  return {
    constants: resolveSelectorGroup(versionedConstants, version),
    apis: resolveSelectorGroup(versionedAPIs, version),
  };
}

function resolveSelectorGroup<T>(group: VersionedSelectorGroup, grafanaVersion: string): SelectorsOf<T> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(group)) {
    if (isVersionedStringSelector(value)) {
      result[key] = resolveStringSelector(value, grafanaVersion);
    }

    if (isVersionedFunctionSelector(value)) {
      result[key] = resolveFunctionSelector(value, grafanaVersion);
    }

    if (isVersionedSelectorGroup(value)) {
      result[key] = resolveSelectorGroup(value, grafanaVersion);
    }
  }

  return result as SelectorsOf<T>;
}

function isVersionedFunctionSelector(
  target: VersionedFunctionSelector | VersionedStringSelector | VersionedSelectorGroup
): target is VersionedFunctionSelector {
  if (typeof target === 'object') {
    const [first] = Object.keys(target);
    return !!semver.valid(first) && typeof target[first] === 'function';
  }

  return false;
}

function isVersionedStringSelector(
  target: VersionedFunctionSelector | VersionedStringSelector | VersionedSelectorGroup
): target is VersionedStringSelector {
  if (typeof target === 'object') {
    const [first] = Object.keys(target);
    return !!semver.valid(first) && typeof target[first] === 'string';
  }

  return false;
}

function isVersionedSelectorGroup(
  target: VersionedFunctionSelector | VersionedStringSelector | VersionedSelectorGroup
): target is VersionedSelectorGroup {
  if (typeof target === 'object') {
    const [first] = Object.keys(target);
    return !semver.valid(first);
  }

  return false;
}

function resolveStringSelector(versionedSelector: VersionedStringSelector, grafanaVersion: string): StringSelector {
  let [versionToUse, ...versions] = Object.keys(versionedSelector).sort(semver.rcompare);

  for (const version of versions) {
    if (semver.gte(version, grafanaVersion)) {
      versionToUse = version;
    }
  }

  return versionedSelector[versionToUse];
}

function resolveFunctionSelector(
  versionedSelector: VersionedFunctionSelector,
  grafanaVersion: string
): FunctionSelector {
  let [versionToUse, ...versions] = Object.keys(versionedSelector).sort(semver.rcompare);

  for (const version of versions) {
    if (semver.gte(version, grafanaVersion)) {
      versionToUse = version;
    }
  }

  return versionedSelector[versionToUse];
}
