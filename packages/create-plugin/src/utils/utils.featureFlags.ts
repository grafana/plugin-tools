import fs from 'fs';
import path from 'path';

type FeatureFlags = {
  bundleGrafanaUI: boolean;
};

type CPRCFile = {
  features: FeatureFlags;
};

export function getFeatureFlags(): FeatureFlags {
  try {
    const rootPath = path.resolve(__dirname, '..', '..', '.cprc.json');
    const rootConfig = readRCFileSync(rootPath);

    const userPath = path.resolve(__dirname, '.cprc.json');
    const userConfig = readRCFileSync(userPath);

    return createFeatureFlags({
      ...rootConfig?.features,
      ...userConfig?.features,
    });
  } catch (error) {
    // log something about the error
    // and use default flags
    return createFeatureFlags();
  }
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
