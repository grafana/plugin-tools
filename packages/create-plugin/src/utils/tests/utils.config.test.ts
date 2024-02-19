import fs from 'fs/promises';
import path from 'path';
import { vi } from 'vitest';
import os from 'os';
import { getVersion } from '../utils.version.js';
import { getConfig, UserConfig, CreatePluginConfig } from '../utils.config.js';
import { DEFAULT_FEATURE_FLAGS } from '../../constants.js';

const mocks = vi.hoisted(() => {
  return {
    commandName: 'generate',
  };
});

vi.mock('../utils.cli.js', async () => mocks);

const tmpDir = path.join(os.tmpdir(), 'cp-test-config');

describe('getConfig', () => {
  beforeEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.mkdir(tmpDir, { recursive: true });
  });

  describe('Command: Generate', () => {
    beforeEach(() => {
      mocks.commandName = 'generate';
    });

    it('should give back a default config', async () => {
      const config = getConfig(tmpDir);

      expect(config).toEqual({
        version: getVersion(),
        features: DEFAULT_FEATURE_FLAGS,
      });
    });
  });

  describe('Command: Update', () => {
    beforeEach(() => {
      mocks.commandName = 'update';
    });

    it('should give back the correct config when there are no config files at all', async () => {
      const config = getConfig();

      expect(config).toEqual({
        version: getVersion(),
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
        version: getVersion(),
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
