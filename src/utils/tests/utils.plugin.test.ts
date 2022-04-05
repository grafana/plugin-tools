import { TEMPLATE_PATHS } from '../../constants';
import { getPluginJson, updateDependencies } from '../utils.plugin';

describe('Utils / Plugins', () => {
  describe('getPluginJson()', () => {
    test('should return the parsed plugin JSON if the file exits', () => {
      const srcDir = `${TEMPLATE_PATHS.app}/src`;
      const pluginJson = getPluginJson(srcDir);

      expect(pluginJson).toBeDefined();
      expect(pluginJson.type).toBe('app');
    });

    test('should throw an error if the plugin.json is not found', () => {
      const srcDir = `${TEMPLATE_PATHS.app}/src/unknown`;

      expect(() => {
        getPluginJson(srcDir);
      }).toThrow();
    });
  });

  describe('updateDependencies()', () => {
    test('it should update existing dependencies', () => {
      expect(
        updateDependencies(
          // current
          {
            '@grafana/tsconfig': '^1.2.0-rc1',
            '@swc/core': '^1.2.162',
            '@types/minimist': '^1.2.2',
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
        updateDependencies(
          // current
          {
            '@grafana/tsconfig': '^1.2.0-rc1',
            '@swc/core': '^1.2.162',
          },
          // new
          {
            '@grafana/tsconfig': '^1.2.0-rc1',
            '@swc/core': '^1.2.162',
            '@types/minimist': '^1.4.2', // new
          }
        )
      ).toEqual({
        '@grafana/tsconfig': '^1.2.0-rc1',
        '@swc/core': '^1.2.162',
        '@types/minimist': '^1.4.2', // new
      });
    });

    test('it should be possible to only update dependencies that are outdated (compared to the new ones we are passing in)', () => {
      expect(
        updateDependencies(
          // current
          {
            '@grafana/tsconfig': '^1.2.0-rc1',
            '@swc/core': '^1.2.162',
            '@types/minimist': '^1.2.2',
            '@types/mkdirp': '^1.0.2',
            '@types/semver': '^8.0.0',
            'node-plop': '0.26.3',
          },
          // new
          {
            '@grafana/tsconfig': '^2.0.0', // updated
            '@swc/core': '^1.2.162',
            '@types/minimist': '^1.4.2', // updated
            '@types/mkdirp': '^1.0.2',
            '@types/semver': '^7.3.9', // older than the current version -> don't touch it if `onlyOutdated: true` is set
          },
          {
            // By setting to TRUE the function will not touch any dependencies that are on a newer version already
            onlyOutdated: true,
          }
        )
      ).toEqual({
        '@grafana/tsconfig': '^2.0.0', // updated
        '@swc/core': '^1.2.162',
        '@types/minimist': '^1.4.2', // updated
        '@types/mkdirp': '^1.0.2',
        '@types/semver': '^8.0.0',
        'node-plop': '0.26.3',
      });
    });

    test('it should downgrade dependencies by default', () => {
      expect(
        updateDependencies(
          // current
          {
            '@grafana/tsconfig': '^1.2.0-rc1',
            '@swc/core': '^1.2.162',
            '@types/minimist': '^1.2.2',
            '@types/mkdirp': '^1.0.2',
            '@types/semver': '^8.0.0',
            'node-plop': '0.26.3',
          },
          // new
          {
            '@grafana/tsconfig': '^2.0.0', // updated
            '@swc/core': '^1.2.162',
            '@types/minimist': '^1.4.2', // updated
            '@types/mkdirp': '^1.0.2',
            '@types/semver': '^7.3.9', // older than the current version -> we are downgrading it by default if `onlyOutdated: true` is not specified
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
  });
});
