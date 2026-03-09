import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import semver from 'semver';
import { getMinSupportedVersionFromPackageJson, getMinSupportedGrafanaVersion } from './minGrafanaVersion';

describe('getMinSupportedVersionFromPackageJson', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw if plugin.json does not exist', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    expect(() => getMinSupportedVersionFromPackageJson()).toThrow("Couldn't find src/plugin.json");
  });

  it('should throw if minVersion cannot be determined', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(semver, 'minVersion').mockReturnValue(null);

    expect(() => getMinSupportedVersionFromPackageJson()).toThrow(
      'Could not determine minimum supported version from package.json'
    );
  });

  it.each([
    { range: '>=11.0.0', expected: '11.0.0' },
    { range: '>=11.0.0-0', expected: '11.0.0' },
    { range: '>=11.1.0-beta.1', expected: '11.1.0' },
    { range: '^10.4.0', expected: '10.4.0' },
    { range: '~12.1.0', expected: '12.1.0' },
    { range: '>=9.5.3', expected: '9.5.3' },
  ])('should resolve "$range" to "$expected"', ({ range, expected }) => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(semver, 'minVersion').mockReturnValue(semver.minVersion(range));

    expect(getMinSupportedVersionFromPackageJson()).toBe(expected);
  });
});

describe('getMinSupportedGrafanaVersion', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return the version from context options if provided', () => {
    const context = {
      options: [{ minGrafanaVersion: '10.0.0' }],
    } as Parameters<typeof getMinSupportedGrafanaVersion>[0];

    expect(getMinSupportedGrafanaVersion(context)).toBe('10.0.0');
  });

  it('should fall back to plugin.json when no options are provided', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(semver, 'minVersion').mockReturnValue(semver.minVersion('>=11.0.0'));

    const context = {
      options: [],
    } as unknown as Parameters<typeof getMinSupportedGrafanaVersion>[0];

    expect(getMinSupportedGrafanaVersion(context)).toBe('11.0.0');
  });
});
