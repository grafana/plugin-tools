import fs from 'fs';
import path from 'path';

type FeatureFlags = {
  bundleGrafanaUI: boolean;
};

type CPRCFile = {
  version: string;
  features: FeatureFlags;
};

export function getRCFile(): CPRCFile | undefined {
  try {
    const rootPath = path.resolve(process.cwd(), '.config/.cprc.json');
    const rootConfig = readRCFileSync(rootPath);

    const userPath = path.resolve(process.cwd(), '.cprc.json');
    const userConfig = readRCFileSync(userPath);

    return {
      ...rootConfig,
      ...userConfig,
      features: createFeatureFlags({
        ...rootConfig.features,
        ...userConfig.features,
      }),
    };
  } catch (error) {
    return undefined;
  }
}

export function getFeatureFlags(): FeatureFlags {
  return createFeatureFlags(getRCFile()?.features);
}

function readRCFileSync(path: string): CPRCFile | undefined {
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
