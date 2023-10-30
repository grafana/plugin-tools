import fs from 'fs';
import path from 'path';

type FeatureFlags = {
  bundleGrafanaUI: boolean;
};

type CreatePluginConfig = UserConfig & {
  version: string;
};

type UserConfig = {
  features: FeatureFlags;
};

export function getConfig(): CreatePluginConfig {
  try {
    const rootPath = path.resolve(process.cwd(), '.config/.cprc.json');
    const rootConfig = readRCFileSync(rootPath);
    const userConfig = getUserConfig();

    return {
      ...rootConfig,
      ...userConfig,
      version: rootConfig.version,
      features: createFeatureFlags({
        ...rootConfig.features,
        ...userConfig.features,
      }),
    };
  } catch (error) {
    return {
      version: 'n/a',
      features: createFeatureFlags(),
    };
  }
}

function getUserConfig(): UserConfig | undefined {
  try {
    const userPath = path.resolve(process.cwd(), '.cprc.json');
    const userConfig = readRCFileSync(userPath);

    return {
      ...userConfig,
      features: createFeatureFlags({
        ...userConfig.features,
      }),
    };
  } catch (error) {
    return {
      features: createFeatureFlags(),
    };
  }
}

function readRCFileSync(path: string): CreatePluginConfig | undefined {
  try {
    const data = fs.readFileSync(path);
    return JSON.parse(data.toString());
  } catch (error) {
    return undefined;
  }
}

function createFeatureFlags(flags?: FeatureFlags): FeatureFlags {
  return {
    bundleGrafanaUI: false,
    ...flags,
  };
}
