import { dirSync } from 'tmp';
import fs from 'fs/promises';
import path from 'path';
import { vi } from 'vitest';

import { CURRENT_APP_VERSION } from '../utils.version.js';
import { getConfig, UserConfig, CreatePluginConfig } from '../utils.config.js';
import { DEFAULT_FEATURE_FLAGS } from '../../constants.js';

const mocks = vi.hoisted(() => {
  return {
    commandName: 'generate',
    argv: {},
  };
});

vi.mock('../utils.cli.js', async () => mocks);

const tmpObj = dirSync({ unsafeCleanup: true });
const tmpDir = path.join(tmpObj.name, 'cp-test-config');

describe('getConfig', () => {
  beforeEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterAll(() => {
    tmpObj.removeCallback();
  });

  describe('Command: Generate', () => {
    beforeEach(() => {
      mocks.commandName = 'generate';
      mocks.argv = {};
    });

    it('should give back a default config', async () => {
      const config = getConfig(tmpDir);

      expect(config).toEqual({
        version: CURRENT_APP_VERSION,
        features: DEFAULT_FEATURE_FLAGS,
      });
    });

    it('should override default feature flags via cli args', async () => {
      mocks.argv = {
        'feature-flags': 'bundleGrafanaUI',
      };
      const config = getConfig(tmpDir);

      expect(config).toEqual({
        version: CURRENT_APP_VERSION,
        features: { ...DEFAULT_FEATURE_FLAGS, bundleGrafanaUI: true },
      });
    });
  });

  describe('Command: Update', () => {
    beforeEach(() => {
      mocks.commandName = 'update';
      mocks.argv = {};
    });

    it('should give back the correct config when there are no config files at all', async () => {
      const config = getConfig();

      expect(config).toEqual({
        version: CURRENT_APP_VERSION,
        features: {},
      });
    });

    it('should give back the correct config when there is no user config', async () => {
      const rootConfigPath = path.join(tmpDir, '.config', '.cprc.json');
      const rootConfig: CreatePluginConfig = {
        version: '1.0.0',
        features: {},
      };

      await fs.mkdir(path.dirname(rootConfigPath), { recursive: true });
      await fs.writeFile(rootConfigPath, JSON.stringify(rootConfig));

      const config = getConfig(tmpDir);

      expect(config).toEqual({
        version: rootConfig.version,
        features: {},
      });
    });

    it('should give back the correct config when there is no root config', async () => {
      const userConfigPath = path.join(tmpDir, '.cprc.json');
      const userConfig: UserConfig = {
        features: {
          useReactRouterV6: true,
          bundleGrafanaUI: true,
        },
      };

      await fs.writeFile(userConfigPath, JSON.stringify(userConfig));

      const config = getConfig(tmpDir);

      expect(config).toEqual({
        version: CURRENT_APP_VERSION,
        features: userConfig.features,
      });
    });

    it('should give back the correct config when config files exist', async () => {
      const rootConfigPath = path.join(tmpDir, '.config', '.cprc.json');
      const userConfigPath = path.join(tmpDir, '.cprc.json');
      const rootConfig: CreatePluginConfig = {
        version: '1.0.0',
        features: {},
      };
      const userConfig: UserConfig = {
        features: {
          useReactRouterV6: false,
          bundleGrafanaUI: false,
        },
      };

      await fs.mkdir(path.dirname(rootConfigPath), { recursive: true });
      await fs.writeFile(rootConfigPath, JSON.stringify(rootConfig));
      await fs.writeFile(userConfigPath, JSON.stringify(userConfig));

      const config = getConfig(tmpDir);

      expect(config).toEqual({ ...rootConfig, ...userConfig });
    });
  });
});
