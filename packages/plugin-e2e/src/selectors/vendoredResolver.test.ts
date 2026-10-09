import * as semver from 'semver';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { compare, gte, valid } from '../utils/version';
import { resolveSelectors } from './vendored/resolver';
import { versionedComponents, versionedPages } from './vendored';

// the vendored resolver runs on our own version helpers instead of semver, so pin that they resolve the
// real selector tree exactly like upstream does
const tree = { versionedComponents, versionedPages };

function collectVersionKeys(node: object, keys = new Set<string>()): Set<string> {
  for (const [key, value] of Object.entries(node)) {
    if (semver.valid(key)) {
      keys.add(key);
    } else if (value && typeof value === 'object') {
      collectVersionKeys(value, keys);
    }
  }
  return keys;
}

const versionKeys = [...collectVersionKeys(tree)];
const grafanaVersions = [
  'latest',
  '',
  'not-a-version',
  '7.0.0',
  '99.0.0',
  '12.4.0-pre',
  '13.3.0-24547284055',
  'v11.0.0',
  ...versionKeys.flatMap((key) => {
    const [major, minor, patch] = key.split('.').map(Number);
    return [key, `${major}.${minor}.${patch + 1}`, ...(patch > 0 ? [`${major}.${minor}.${patch - 1}`] : [])];
  }),
];

// functions compare by what they return, since the two trees hold distinct function instances
function serialize(resolved: unknown): string {
  return JSON.stringify(resolved, (_key, value) => (typeof value === 'function' ? `fn:${value('A', 'B')}` : value));
}

describe('vendored resolver', () => {
  let resolveWithSemver: typeof resolveSelectors;

  beforeAll(async () => {
    vi.resetModules();
    vi.doMock('../utils/version', () => ({ gte: semver.gte, compare: semver.compare, valid: semver.valid }));
    ({ resolveSelectors: resolveWithSemver } = await import('./vendored/resolver.js'));
    vi.doUnmock('../utils/version');
  });

  it('finds version keys in the vendored tree', () => {
    expect(versionKeys.length).toBeGreaterThan(10);
  });

  it('agrees with semver on every pair of version keys', () => {
    for (const a of versionKeys) {
      for (const b of versionKeys) {
        expect([a, b, compare(a, b), gte(a, b)]).toEqual([a, b, semver.compare(a, b), semver.gte(a, b)]);
      }
    }
  });

  it.each(grafanaVersions)('agrees with semver on valid(%j)', (version) => {
    expect(valid(version)).toBe(semver.valid(version));
  });

  it.each(grafanaVersions)('resolves the tree for Grafana %j like semver does', (version) => {
    expect(serialize(resolveSelectors(tree, version))).toBe(serialize(resolveWithSemver(tree, version)));
  });
});
