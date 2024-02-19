import fs from 'fs/promises';
import path from 'path';
import { vi } from 'vitest';
import os from 'os';
import { getVersion } from '../utils.version.js';
import { getConfig, UserConfig, CreatePluginConfig } from '../utils.config.js';

const mocks = vi.hoisted(() => {
  return {
    commandName: 'generate',
  };
});

vi.mock('../utils.cli.js', async () => {
  return {
    commandName: mocks.commandName,
  };
});

const tmpDir = path.join(os.tmpdir(), 'cp-test-config');

beforeEach(async () => {
  // Create temporary directory for testing
  await fs.mkdir(tmpDir, { recursive: true });
});

afterEach(async () => {
  // Clean up temporary directory
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('getConfig', () => {
  it('should correctly read configuration from file system', async () => {
    // Prepare
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

    // Act
    const config = getConfig(tmpDir);

    // Assert
    expect(config).toEqual({ ...rootConfig, ...userConfig });
  });

  describe('Command: Generate', () => {
    beforeEach(() => {
      mocks.commandName = 'generate';
    });

    it('should give back a default config', async () => {
      const config = getConfig(tmpDir);

      expect(config).toEqual({
        version: getVersion(),
        // TODO - get this from somewhere and don't wire in the default values here
        features: {
          bundleGrafanaUI: false,
          useReactRouterV6: true,
        },
      });
    });
  });

  describe('Command: Update', () => {
    it('should give back the correct config when there are no config files at all', async () => {});
    it('should give back the correct config when there is no user config', async () => {});
    it('should give back the correct config when there is no root config', async () => {});
    it('should give back the correct config when config files exist', async () => {});
  });
});
