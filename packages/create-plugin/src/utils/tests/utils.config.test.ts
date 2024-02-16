import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { getConfig, UserConfig, CreatePluginConfig } from '../utils.config.js';

const tmpDir = path.join(os.tmpdir(), 'cp-test-config');

beforeAll(async () => {
  // Create temporary directory for testing
  await fs.mkdir(tmpDir, { recursive: true });
});

afterAll(async () => {
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
});
