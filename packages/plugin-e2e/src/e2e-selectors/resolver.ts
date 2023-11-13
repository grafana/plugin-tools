const semver = require('semver');
import { E2ESelectors, VersionedSelectors } from './types';

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
          if (semver.gte(grafanaVersion.replace('-pre', ''), version)) {
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

export const resolveSelectors = (versionedSelectors: VersionedSelectors, version: string): E2ESelectors => {
  const selectors: E2ESelectors = {} as E2ESelectors;
  const s = processSelectors(selectors, versionedSelectors, version);
  return s;
};
