import fs from 'node:fs';
import path from 'node:path';
import { getRuntimeVersion } from './utils.version.js';

type FeatureFlags = {
  bundleGrafanaUI: boolean;
};

type CreatePluginConfig = UserConfig & {
  version: string;
};

type UserConfig = {
  features: FeatureFlags;
};

/* The reason for having two config files (a base .cprc.json under the .config/ folder and a user-specific one at the root fo the project)
 * is that we don't want to update certain user settings during updates, like enabled feature flags.
 */
export function getConfig(): CreatePluginConfig {
  try {
    const rootPath = path.resolve(process.cwd(), '.config/.cprc.json');
    const rootConfig = readRCFileSync(rootPath);
    const userConfig = getUserConfig();

    return {
      ...rootConfig,
      ...userConfig,
      version: rootConfig!.version,
      features: createFeatureFlags({
        ...rootConfig!.features,
        ...userConfig!.features,
      }),
    };
  } catch (error) {
    return {
      version: getRuntimeVersion(),
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
        ...userConfig!.features,
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
