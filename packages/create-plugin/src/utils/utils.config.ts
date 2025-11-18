import { argv, commandName } from './utils.cli.js';

import { CURRENT_APP_VERSION } from './utils.version.js';
import { DEFAULT_FEATURE_FLAGS } from '../constants.js';
import fs from 'node:fs';
import { output } from './utils.console.js';
import { partitionArr } from './utils.helpers.js';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { EOL } from 'node:os';

export type FeatureFlags = {
  bundleGrafanaUI?: boolean;

  // If set to true, the plugin will be scaffolded with React Router v6. Defaults to true.
  // (Attention! We always scaffold new projects with React Router v6, so if you are changing this to `false` manually you will need to make changes to the React code as well.)
  useReactRouterV6?: boolean;
  useExperimentalRspack?: boolean;
  useExperimentalUpdates?: boolean;
};

export type CreatePluginConfig = UserConfig & {
  version: string;
};

export type UserConfig = {
  features: FeatureFlags;
};

// TODO: Create a config manager of sorts so we don't call getConfig multiple times rendering multiple warnings.
let hasShownConfigWarnings = false;

export function getConfig(workDir = process.cwd()): CreatePluginConfig {
  const rootConfig = getRootConfig(workDir);
  const userConfig = getUserConfig(workDir);

  return {
    ...rootConfig,
    ...userConfig,
    version: rootConfig!.version,
    features: createFeatureFlags({
      ...(rootConfig!.features ?? {}),
      ...(userConfig!.features ?? {}),
    }),
  };
}

function getRootConfig(workDir = process.cwd()): CreatePluginConfig {
  try {
    const rootPath = path.resolve(workDir, '.config/.cprc.json');
    const rootConfig = readRCFileSync(rootPath);

    return {
      version: CURRENT_APP_VERSION,
      ...rootConfig,
      features: rootConfig!.features ?? {},
    };
    // Most likely this happens because of no ".config/.cprc.json" (root configuration) file.
    // (This can both happen for new scaffolds and for existing plugins that have not been updated yet.)
  } catch (error) {
    return {
      version: CURRENT_APP_VERSION,
      features: {},
    };
  }
}

function getUserConfig(workDir = process.cwd()): UserConfig | undefined {
  try {
    const userPath = path.resolve(workDir, '.cprc.json');
    const userConfig = readRCFileSync(userPath);

    return {
      ...userConfig,
      features: userConfig!.features ?? {},
    };
    // Most likely this happens because of no ".cprc.json" (user configuration) file.
    // (This can both happen for new scaffolds and for existing plugins that have not been updated yet.)
  } catch (error) {
    return {
      features: {},
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

// This function creates feature flags based on the defaults for generate command else flags read from config.
// In all cases it will override the flags with the featureFlag cli arg values.
function createFeatureFlags(flags?: FeatureFlags): FeatureFlags {
  const featureFlags = commandName === 'generate' ? DEFAULT_FEATURE_FLAGS : (flags ?? {});
  const cliArgFlags = parseFeatureFlagsFromCliArgs();
  return { ...featureFlags, ...cliArgFlags };
}

function parseFeatureFlagsFromCliArgs() {
  const flagsfromCliArgs: string[] = argv['feature-flags'] ? argv['feature-flags'].split(',') : [];
  const availableFeatureFlags = Object.keys(DEFAULT_FEATURE_FLAGS);
  const [knownFlags, unknownFlags] = partitionArr(flagsfromCliArgs, (item) => availableFeatureFlags.includes(item));

  if (unknownFlags.length > 0 && !hasShownConfigWarnings) {
    output.warning({
      withPrefix: false,
      title: 'Warning! Unknown feature flags detected.',
      body: [
        'The following feature-flags are unknown:',
        unknownFlags.join(', '),
        `Available feature-flags are: ${availableFeatureFlags.join(', ')}`,
      ],
    });
    hasShownConfigWarnings = true;
  }

  return knownFlags.reduce((acc, flag) => {
    return { ...acc, [flag]: true };
  }, {} as FeatureFlags);
}

export async function setRootConfig(configOverride: Partial<CreatePluginConfig> = {}): Promise<CreatePluginConfig> {
  const rootConfig = getRootConfig();
  const rootConfigPath = path.resolve(process.cwd(), '.config/.cprc.json');
  const updatedConfig = { ...rootConfig, ...configOverride };

  await writeFile(rootConfigPath, JSON.stringify(updatedConfig, null, 2) + EOL);

  return updatedConfig;
}
