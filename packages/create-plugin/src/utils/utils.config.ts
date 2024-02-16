import fs from 'node:fs';
import path from 'node:path';
import { getVersion } from './utils.version.js';
import { commandName } from './utils.cli.js';

export type FeatureFlags = {
  bundleGrafanaUI?: boolean;

  // If set to true, the plugin will be scaffolded with React Router v6. Defaults to true.
  // (Attention! We always scaffold new projects with React Router v6, so if you are changing this to `false` manually you will need to make changes to the React code as well.)
  useReactRouterV6?: boolean;
};

export type CreatePluginConfig = UserConfig & {
  version: string;
};

export type UserConfig = {
  features: FeatureFlags;
};

export function getConfig(workDir = process.cwd()): CreatePluginConfig {
  const rootConfig = getRootConfig(workDir);
  const userConfig = getUserConfig(workDir);

  return {
    ...rootConfig,
    ...userConfig,
    version: rootConfig!.version,
    features: createFeatureFlags({
      ...rootConfig!.features,
      ...userConfig!.features,
    }),
  };
}

function getRootConfig(workDir = process.cwd()): CreatePluginConfig {
  const defaultConfig = {
    version: getVersion(),
    features: createFeatureFlags(),
  };

  try {
    const rootPath = path.resolve(workDir, '.config/.cprc.json');
    const rootConfig = readRCFileSync(rootPath);

    return {
      ...defaultConfig,
      ...rootConfig,
      features: {
        ...defaultConfig.features,
        ...rootConfig!.features,
      },
    };
    // Most likely this happens because of no ".config/.cprc.json" (root configuration) file.
    // (This can both happen for new scaffolds and for existing plugins that have not been updated yet.)
  } catch (error) {
    // Scaffolding a new plugin
    if (commandName === 'generate') {
      return defaultConfig;
    }

    // Most probably updating an existing plugin
    return {
      ...defaultConfig,
      features: createDisabledFeatureFlags(),
    };
  }
}

function getUserConfig(workDir = process.cwd()): UserConfig | undefined {
  try {
    const userPath = path.resolve(workDir, '.cprc.json');
    const userConfig = readRCFileSync(userPath);

    return {
      ...userConfig,
      features: createFeatureFlags({
        ...userConfig!.features,
      }),
    };
    // Most likely this happens because of no ".cprc.json" (user configuration) file.
    // (This can both happen for new scaffolds and for existing plugins that have not been updated yet.)
  } catch (error) {
    // Scaffolding a new plugin
    if (commandName === 'generate') {
      return {
        features: createFeatureFlags(),
      };
    }

    // Most probably updating an existing plugin
    return {
      features: createDisabledFeatureFlags(),
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
  // Default values for new scaffoldings
  return {
    useReactRouterV6: true,
    bundleGrafanaUI: false,
    ...flags,
  };
}

function createDisabledFeatureFlags(): FeatureFlags {
  return {
    useReactRouterV6: false,
    bundleGrafanaUI: false,
  };
}
