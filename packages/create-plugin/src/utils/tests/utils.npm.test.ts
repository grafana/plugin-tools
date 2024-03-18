import { vi } from 'vitest';
import {
  updateNpmDependencies,
  getUpdatableNpmDependencies,
  hasNpmDependenciesToUpdate,
  getPackageJsonUpdatesAsText,
  updatePackageJson,
} from '../utils.npm.js';

const mocks = vi.hoisted(() => {
  return {
    getPackageJson: vi.fn(),
    getLatestPackageJson: vi.fn(),
    writePackageJson: vi.fn(),
  };
});

vi.mock('../utils.packagejson.js', async () => {
  return {
    getPackageJson: mocks.getPackageJson,
    getLatestPackageJson: mocks.getLatestPackageJson,
    writePackageJson: mocks.writePackageJson,
  };
});

describe('Utils / NPM', () => {
  describe('getUpdatableNpmDependencies()', () => {
    test('it should return a summary of dependencies to be updated', () => {
      expect(
        getUpdatableNpmDependencies(
          // current
          {
            '@grafana/tsconfig': '^1.2.0-rc1',
            '@swc/core': '^1.2.162',
            '@types/minimist': '^1.6.2',
            '@types/mkdirp': '^1.0.2',
            '@types/semver': '^7.3.9',
            'node-plop': '0.26.3',
          },
          // new
          {
            '@grafana/tsconfig': '^2.0.0', // updated
            '@swc/core': '^1.2.162',
            '@types/minimist': '^1.4.2', // updated
            '@types/mkdirp': '^1.0.2',
            '@types/semver': '^7.3.9',
          }
        )
      ).toEqual({
        '@grafana/tsconfig': { prev: '^1.2.0-rc1', next: '^2.0.0' },
        '@types/minimist': { prev: '^1.6.2', next: '^1.4.2' },
      });
    });

    test('it should be possible to only update dependencies that are outdated', () => {
      expect(
        getUpdatableNpmDependencies(
          // current
          {
            '@grafana/tsconfig': '^1.2.0-rc1',
            '@swc/core': '^1.2.162',
            '@types/minimist': '^1.6.2',
            '@types/mkdirp': '^1.0.2',
            '@types/semver': '^7.3.9',
            'node-plop': '0.26.3',
          },
          // new
          {
            '@grafana/tsconfig': '^2.0.0', // updated
            '@swc/core': '^1.2.162',
            '@types/minimist': '^1.4.2', // updated - BUT older than the current one
            '@types/mkdirp': '^1.0.2',
            '@types/semver': '^7.3.9',
          },
          { onlyOutdated: true }
        )
      ).toEqual({
        '@grafana/tsconfig': { prev: '^1.2.0-rc1', next: '^2.0.0' },
      });
    });

    test('it should be able to override with using release channels like "latest"', () => {
      expect(
        getUpdatableNpmDependencies(
          // current
          {
            '@grafana/tsconfig': 'latest',
            '@swc/core': '^1.2.162',
            '@types/minimist': '^1.6.2',
            '@types/mkdirp': '^1.0.2',
            '@types/semver': '^7.3.9',
            'node-plop': '0.26.3',
          },
          // new
          {
            '@grafana/tsconfig': '^2.0.0', // updated
            '@swc/core': 'latest', // updated
            '@types/minimist': '^1.4.2', // updated
            '@types/mkdirp': '^1.0.2',
            '@types/semver': '^7.3.9',
          }
        )
      ).toEqual({
        '@grafana/tsconfig': { prev: 'latest', next: '^2.0.0' },
        '@swc/core': { prev: '^1.2.162', next: 'latest' },
        '@types/minimist': { prev: '^1.6.2', next: '^1.4.2' },
      });
    });
  });

  describe('updateNpmDependencies()', () => {
    test('it should update existing dependencies', () => {
      expect(
        updateNpmDependencies(
          // dependencies
          {
            '@grafana/tsconfig': '^1.2.0-rc1',
            '@swc/core': '^1.2.162',
            '@types/minimist': '^1.2.2',
            '@types/mkdirp': '^1.0.2',
            '@types/semver': '^7.3.9',
            'node-plop': '0.26.3',
          },
          // update summary
          {
            '@grafana/tsconfig': { prev: '^1.2.0-rc1', next: '^2.0.0' },
            '@types/minimist': { prev: '^1.2.2', next: '^1.4.2' },
          }
        )
      ).toEqual({
        '@grafana/tsconfig': '^2.0.0', // updated
        '@swc/core': '^1.2.162',
        '@types/minimist': '^1.4.2', // updated
        '@types/mkdirp': '^1.0.2',
        '@types/semver': '^7.3.9',
        'node-plop': '0.26.3',
      });
    });

    test('it should add new depdendencies', () => {
      expect(
        updateNpmDependencies(
          // dependencies
          {
            '@grafana/tsconfig': '^1.2.0-rc1',
            '@swc/core': '^1.2.162',
          },
          // update summary
          {
            '@grafana/tsconfig': { prev: '^1.2.0-rc1', next: '^1.2.0-rc1' },
            '@swc/core': { prev: '^1.2.162', next: '^1.2.162' },
            '@types/minimist': { prev: null, next: '^1.4.2' }, // new
          }
        )
      ).toEqual({
        '@grafana/tsconfig': '^1.2.0-rc1',
        '@swc/core': '^1.2.162',
        '@types/minimist': '^1.4.2', // new
      });
    });

    test('it should override `latest` and other release channels', () => {
      expect(
        updateNpmDependencies(
          // dependencies
          {
            '@grafana/tsconfig': 'latest',
            '@swc/core': '^1.2.162',
            '@types/minimist': '^1.2.2',
            '@types/mkdirp': '^1.0.2',
            '@types/semver': '^8.0.0',
            'node-plop': '0.26.3',
          },
          // update summary
          {
            '@grafana/tsconfig': { prev: 'latest', next: '^2.0.0' },
          }
        )
      ).toEqual({
        '@grafana/tsconfig': '^2.0.0', // updated
        '@swc/core': '^1.2.162',
        '@types/minimist': '^1.2.2',
        '@types/mkdirp': '^1.0.2',
        '@types/semver': '^8.0.0',
        'node-plop': '0.26.3',
      });
    });

    test('it should be able to override with using release channels like "latest"', () => {
      expect(
        updateNpmDependencies(
          // dependencies
          {
            '@grafana/tsconfig': '^2.0.0',
            '@swc/core': '^1.2.162',
            '@types/minimist': '^1.2.2',
            '@types/mkdirp': '^1.0.2',
            '@types/semver': '^8.0.0',
            'node-plop': '0.26.3',
          },
          // update summary
          {
            '@grafana/tsconfig': { prev: '', next: 'latest' },
          }
        )
      ).toEqual({
        '@grafana/tsconfig': 'latest', // updated
        '@swc/core': '^1.2.162',
        '@types/minimist': '^1.2.2',
        '@types/mkdirp': '^1.0.2',
        '@types/semver': '^8.0.0',
        'node-plop': '0.26.3',
      });
    });
  });

  describe('hasNpmDependenciesToUpdate()', () => {
    test('It should return false when there are no npm dependencies to update', () => {
      const packageJson = {
        dependencies: {
          '@grafana/ui': '10.0.0',
          react: '18.2.0',
        },
        devDependencies: {
          '@testing-library/react': '12.0.0',
          sass: '1.0.0',
        },
        scripts: {},
      };

      // same package.json for existing and latest
      mocks.getPackageJson.mockReturnValue(packageJson);
      mocks.getLatestPackageJson.mockReturnValue(packageJson);

      const result = hasNpmDependenciesToUpdate();
      expect(result).toBe(false);
    });

    test('It should return true when there are npm dependencies to update', () => {
      const packageJson = {
        dependencies: {
          '@grafana/ui': '10.0.0',
          react: '18.2.0',
        },
        devDependencies: {
          '@testing-library/react': '12.0.0',
          sass: '1.0.0',
        },
        scripts: {},
      };

      const latestPackageJson = {
        dependencies: {
          '@grafana/ui': '10.0.0',
          react: '18.2.1', // changed
        },
        devDependencies: {
          '@testing-library/react': '12.0.0',
          sass: '1.0.1', // changed
        },
        scripts: {},
      };

      mocks.getPackageJson.mockReturnValue(packageJson);
      mocks.getLatestPackageJson.mockReturnValue(latestPackageJson);

      const result = hasNpmDependenciesToUpdate();
      expect(result).toBe(true);
    });
  });

  describe('getPackageJsonUpdatesAsText', () => {
    test("It should return an empty text when there's nothing to update", () => {
      const packageJson = {
        dependencies: {
          '@grafana/ui': '10.0.0',
          react: '18.2.0',
        },
        devDependencies: {
          '@testing-library/react': '12.0.0',
          sass: '1.0.0',
        },
        scripts: {},
      };

      mocks.getPackageJson.mockReturnValue(packageJson);
      mocks.getLatestPackageJson.mockReturnValue(packageJson);

      const result = getPackageJsonUpdatesAsText();
      expect(result).toBe('');
    });

    test("It should return the related text when there's an update", () => {
      const packageJson = {
        dependencies: {
          '@grafana/ui': '10.0.0',
          react: '18.2.0',
        },
        devDependencies: {
          '@testing-library/react': '12.0.0',
          sass: '1.0.0',
        },
        scripts: {},
      };

      const latestPackageJson = {
        dependencies: {
          '@grafana/ui': '10.0.0',
          react: '18.2.1', // changed
        },
        devDependencies: {
          '@testing-library/react': '12.0.0',
          sass: '1.0.1', // changed
        },
        scripts: {},
      };

      mocks.getPackageJson.mockReturnValue(packageJson);
      mocks.getLatestPackageJson.mockReturnValue(latestPackageJson);

      const result = getPackageJsonUpdatesAsText();
      expect(result).toContain('sass');
      expect(result).toContain('react');
    });
  });

  describe('updatePackageJson()', () => {
    test('It should not change the package.json if nothing was updated', () => {
      const packageJson = {
        dependencies: {
          '@grafana/ui': '10.0.0',
          react: '18.2.0',
        },
        devDependencies: {
          '@testing-library/react': '12.0.0',
          sass: '1.0.0',
        },
        scripts: {},
      };

      mocks.getPackageJson.mockReturnValue(packageJson);
      mocks.getLatestPackageJson.mockReturnValue(packageJson);

      updatePackageJson();
      //should have the same original content
      expect(mocks.writePackageJson).toHaveBeenCalledWith({
        dependencies: {
          '@grafana/ui': '10.0.0',
          react: '18.2.0',
        },
        devDependencies: {
          '@testing-library/react': '12.0.0',
          sass: '1.0.0',
        },
        scripts: {},
      });
    });

    test('It should change the package.json when something was updated', () => {
      const packageJson = {
        dependencies: {
          '@grafana/ui': '10.0.0',
          react: '18.2.0',
        },
        devDependencies: {
          '@testing-library/react': '12.0.0',
          sass: '1.0.0',
        },
        scripts: {},
      };

      const latestPackageJson = {
        dependencies: {
          '@grafana/ui': '10.0.0',
          react: '18.2.1', //changed
        },
        devDependencies: {
          '@testing-library/react': '12.0.0',
          sass: '1.0.1', //changed
        },
        scripts: {},
      };

      mocks.getPackageJson.mockReturnValue(packageJson);
      mocks.getLatestPackageJson.mockReturnValue(latestPackageJson);

      updatePackageJson();
      //should have the combined content
      expect(mocks.writePackageJson).toHaveBeenCalledWith({
        dependencies: {
          '@grafana/ui': '10.0.0',
          react: '18.2.1', //changed
        },
        devDependencies: {
          '@testing-library/react': '12.0.0',
          sass: '1.0.1', //changed
        },
        scripts: {},
      });
    });
  });
});
