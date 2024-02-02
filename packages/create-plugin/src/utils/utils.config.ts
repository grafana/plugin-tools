import fs from 'node:fs';
import path from 'node:path';
import { getVersion } from './utils.version.js';

type FeatureFlags = {
  bundleGrafanaUI: boolean;

  // If set to true, the plugin will be scaffolded with React Router v6. Defaults to true.
  // (Attention! We always scaffold new projects with React Router v6, so if you are changing this to `false` manually you will need to make changes to the React code as well.)
  useReactRouterV6: boolean;
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
      version: rootConfig!.version,
      features: createFeatureFlags({
        ...rootConfig!.features,
        ...userConfig!.features,
      }),
    };
  } catch (error) {
    return {
      version: getVersion(),
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
    useReactRouterV6: true,
    bundleGrafanaUI: false,
    ...flags,
  };
}
