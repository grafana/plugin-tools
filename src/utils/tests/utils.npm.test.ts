import { updateNpmDependencies, getUpdatableNpmDependencies } from '../utils.npm';

describe('Utils / NPM', () => {
  describe('getDepenciesToBeUpdated()', () => {
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

  describe('updateDependencies()', () => {
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
});
